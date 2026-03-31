import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Word, Wordbook, LearningRecord, EBBINGHAUS_INTERVALS } from './types';

export class WordService {
    private wordbooks: Map<string, Wordbook> = new Map();
    private currentWordbook: Wordbook | null = null;
    private context: vscode.ExtensionContext;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadWordbooks();
    }
    
    private loadWordbooks() {
        const wordbookFiles = ['cet4.json', 'cet6.json', 'kaoyan.json'];
        const extensionPath = this.context.extensionPath;
        
        for (const file of wordbookFiles) {
            try {
                const filePath = path.join(extensionPath, 'assets', 'wordbooks', file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const wordbook: Wordbook = JSON.parse(content);
                this.wordbooks.set(wordbook.id, wordbook);
            } catch (error) {
                console.error(`Failed to load wordbook ${file}:`, error);
            }
        }
    }
    
    getWordbookList(): { id: string; name: string }[] {
        return Array.from(this.wordbooks.values()).map(wb => ({
            id: wb.id,
            name: wb.name
        }));
    }
    
    setCurrentWordbook(wordbookId: string): boolean {
        const wordbook = this.wordbooks.get(wordbookId);
        if (wordbook) {
            this.currentWordbook = wordbook;
            this.context.globalState.update('currentWordbookId', wordbookId);
            return true;
        }
        return false;
    }
    
    getCurrentWordbook(): Wordbook | null {
        if (!this.currentWordbook) {
            const savedId = this.context.globalState.get<string>('currentWordbookId') || 'cet4';
            this.setCurrentWordbook(savedId);
        }
        return this.currentWordbook;
    }
    
    getWordByIndex(index: number): Word | null {
        const wordbook = this.getCurrentWordbook();
        if (!wordbook || wordbook.words.length === 0) {
            return null;
        }
        const safeIndex = ((index % wordbook.words.length) + wordbook.words.length) % wordbook.words.length;
        return wordbook.words[safeIndex];
    }
    
    getWordCount(): number {
        return this.currentWordbook?.words.length || 0;
    }
    
    getWordById(wordId: string): Word | null {
        const wordbook = this.getCurrentWordbook();
        if (!wordbook) return null;
        return wordbook.words.find(w => w.id === wordId) || null;
    }
    
    // 学习记录管理
    async saveRecord(record: LearningRecord) {
        const records = this.context.globalState.get<LearningRecord[]>('learningRecords') || [];
        const existingIndex = records.findIndex(r => r.wordId === record.wordId);
        
        // 计算艾宾浩斯下次复习时间
        if (record.status === 'mastered' || record.status === 'favorite') {
            const stage = record.ebbinghausStage ?? -1;
            const newStage = Math.min(stage + 1, EBBINGHAUS_INTERVALS.length - 1);
            const intervalMinutes = EBBINGHAUS_INTERVALS[newStage];
            record.nextReviewTime = Date.now() + intervalMinutes * 60 * 1000;
            record.ebbinghausStage = newStage;
        }
        
        if (existingIndex >= 0) {
            records[existingIndex] = record;
        } else {
            records.push(record);
        }
        await this.context.globalState.update('learningRecords', records);
    }
    
    getRecord(wordId: string): LearningRecord | undefined {
        const records = this.context.globalState.get<LearningRecord[]>('learningRecords') || [];
        return records.find(r => r.wordId === wordId);
    }
    
    getAllRecords(): LearningRecord[] {
        return this.context.globalState.get<LearningRecord[]>('learningRecords') || [];
    }
    
    // 获取生词本中的单词
    getFavoriteWords(): { word: Word; record: LearningRecord }[] {
        const records = this.getAllRecords().filter(r => r.status === 'favorite');
        const result: { word: Word; record: LearningRecord }[] = [];
        
        for (const record of records) {
            const word = this.getWordById(record.wordId);
            if (word) {
                result.push({ word, record });
            }
        }
        return result;
    }
    
    // 获取已掌握的单词
    getMasteredWords(): { word: Word; record: LearningRecord }[] {
        const records = this.getAllRecords().filter(r => r.status === 'mastered');
        const result: { word: Word; record: LearningRecord }[] = [];
        
        for (const record of records) {
            const word = this.getWordById(record.wordId);
            if (word) {
                result.push({ word, record });
            }
        }
        return result;
    }
    
    // 基于艾宾浩斯遗忘曲线获取需要复习的单词
    getWordsToReview(): { word: Word; record: LearningRecord; priority: number }[] {
        const now = Date.now();
        const records = this.getAllRecords().filter(r => {
            // 只复习已掌握或生词本中的单词
            if (r.status !== 'mastered' && r.status !== 'favorite') {
                return false;
            }
            // 检查是否到了复习时间
            if (!r.nextReviewTime) return true; // 没有设置下次复习时间的也需要复习
            return r.nextReviewTime <= now;
        });
        
        const result: { word: Word; record: LearningRecord; priority: number }[] = [];
        
        for (const record of records) {
            const word = this.getWordById(record.wordId);
            if (word) {
                // 计算优先级：逾期时间越长，优先级越高
                const overdue = now - (record.nextReviewTime || now);
                const priority = overdue + (record.ebbinghausStage || 0) * 1000000;
                result.push({ word, record, priority });
            }
        }
        
        // 按优先级排序（逾期时间长的优先）
        return result.sort((a, b) => b.priority - a.priority);
    }
    
    // 智能推荐下一个要学习的单词
    getRecommendedWord(excludeWordId?: string): Word | null {
        const wordbook = this.getCurrentWordbook();
        if (!wordbook || wordbook.words.length === 0) {
            return null;
        }
        
        // 1. 首先检查是否有需要复习的单词
        const wordsToReview = this.getWordsToReview();
        if (wordsToReview.length > 0) {
            // 优先复习逾期时间最长的
            const recommended = wordsToReview[0].word;
            if (recommended.id !== excludeWordId) {
                return recommended;
            }
        }
        
        // 2. 如果没有需要复习的，推荐新单词（未学习过的）
        const allRecords = this.getAllRecords();
        const learnedIds = new Set(allRecords.map(r => r.wordId));
        
        const newWords = wordbook.words.filter(w => !learnedIds.has(w.id));
        if (newWords.length > 0) {
            // 随机选择一个新单词
            const randomIndex = Math.floor(Math.random() * newWords.length);
            return newWords[randomIndex];
        }
        
        // 3. 如果都学习过了，按顺序返回下一个
        return wordbook.words[0];
    }
    
    // 获取学习统计
    getLearningStats(): {
        totalWords: number;
        masteredCount: number;
        favoriteCount: number;
        newCount: number;
        reviewDueCount: number;
    } {
        const wordbook = this.getCurrentWordbook();
        if (!wordbook) {
            return { totalWords: 0, masteredCount: 0, favoriteCount: 0, newCount: 0, reviewDueCount: 0 };
        }
        
        const records = this.getAllRecords();
        const masteredCount = records.filter(r => r.status === 'mastered').length;
        const favoriteCount = records.filter(r => r.status === 'favorite').length;
        const reviewDueCount = this.getWordsToReview().length;
        
        return {
            totalWords: wordbook.words.length,
            masteredCount,
            favoriteCount,
            newCount: wordbook.words.length - masteredCount - favoriteCount,
            reviewDueCount
        };
    }
}
