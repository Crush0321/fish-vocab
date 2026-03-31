import * as vscode from 'vscode';
import { WordService } from './wordService';
import { Word } from './types';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private wordService: WordService;
    private currentIndex: number = 0;
    private isBossMode: boolean = false;
    private timerId: NodeJS.Timeout | null = null;
    private currentWord: Word | null = null;
    
    constructor(wordService: WordService) {
        this.wordService = wordService;
        
        // 创建状态栏项，放在左侧
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'fishVocab.showDetail';
        this.statusBarItem.tooltip = '点击 (Alt+↓) 查看详情，快捷键：Alt+←上一词，Alt+→下一词，Ctrl+Alt+E隐藏/恢复';
        
        // 恢复上次的位置
        this.currentIndex = 0;
        
        // 安全地更新显示
        try {
            this.updateDisplay();
        } catch (error) {
            console.error('初始化状态栏显示失败:', error);
            this.statusBarItem.text = '$(book) 摸鱼背单词';
            this.statusBarItem.tooltip = '点击开始使用';
        }
        this.statusBarItem.show();
        
        // 自动切换已禁用，仅使用手动快捷键切换
    }
    
    private updateDisplay() {
        if (this.isBossMode) {
            this.statusBarItem.text = '$(eye-closed) 专注中...';
            this.statusBarItem.tooltip = '老板键已激活，按 Alt+E 恢复';
            return;
        }
        
        const word = this.wordService.getWordByIndex(this.currentIndex);
        this.currentWord = word;
        
        if (word) {
            // 缩短显示，避免状态栏过长
            const shortMeaning = word.meaning.length > 15 
                ? word.meaning.substring(0, 15) + '...' 
                : word.meaning;
            this.statusBarItem.text = `$(book) ${word.word} ${word.phonetic} ${shortMeaning}`;
            this.statusBarItem.tooltip = `${word.word} ${word.phonetic}\n${word.meaning}${word.example ? '\n\n例句: ' + word.example : ''}`;
        } else {
            this.statusBarItem.text = '$(book) 请选择词库';
            this.statusBarItem.tooltip = '点击选择词库开始背单词';
        }
    }
    
    startAutoSwitch() {
        // 自动切换已禁用，仅使用手动快捷键切换
        this.stopAutoSwitch();
    }
    
    stopAutoSwitch() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }
    
    previousWord() {
        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex = this.wordService.getWordCount() - 1;
        }
        this.updateDisplay();
    }
    
    nextWord() {
        this.currentIndex++;
        if (this.currentIndex >= this.wordService.getWordCount()) {
            this.currentIndex = 0;
        }
        this.updateDisplay();
    }
    
    // 显示指定单词
    showWord(word: Word) {
        // 查找单词在当前词库中的索引
        const wordCount = this.wordService.getWordCount();
        for (let i = 0; i < wordCount; i++) {
            const w = this.wordService.getWordByIndex(i);
            if (w && w.id === word.id) {
                this.currentIndex = i;
                this.updateDisplay();
                return;
            }
        }
        // 如果没找到，直接更新显示（使用传入的单词信息）
        this.currentWord = word;
        if (!this.isBossMode) {
            const shortMeaning = word.meaning.length > 15 
                ? word.meaning.substring(0, 15) + '...' 
                : word.meaning;
            this.statusBarItem.text = `$(book) ${word.word} ${word.phonetic} ${shortMeaning}`;
            this.statusBarItem.tooltip = `${word.word} ${word.phonetic}\n${word.meaning}${word.example ? '\n\n例句: ' + word.example : ''}`;
        }
    }
    
    toggleBossMode(): boolean {
        this.isBossMode = !this.isBossMode;
        
        // 静默切换，不弹窗提示，更加隐蔽
        console.log(this.isBossMode ? '🛡️ 老板键已激活' : '📖 继续学习');
        
        this.updateDisplay();
        return this.isBossMode;
    }
    
    /**
     * 完全隐藏状态栏（不仅仅是老板键）
     */
    hide() {
        this.statusBarItem.hide();
    }
    
    /**
     * 显示状态栏
     */
    show() {
        if (!this.isBossMode) {
            this.statusBarItem.show();
        }
    }
    
    getCurrentWord(): Word | null {
        return this.currentWord;
    }
    
    getCurrentIndex(): number {
        return this.currentIndex;
    }
    
    isHidden(): boolean {
        return this.isBossMode;
    }
    
    dispose() {
        this.stopAutoSwitch();
        this.statusBarItem.dispose();
    }
}
