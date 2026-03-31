import * as vscode from 'vscode';
import { WordService } from './wordService';
import { Word, LearningRecord } from './types';

/**
 * 控制台伪装管理器
 * 将单词信息伪装成调试日志输出到 OutputChannel
 */
export class ConsoleManager {
    private outputChannel: vscode.OutputChannel;
    private wordService: WordService;
    private currentWord: Word | null = null;
    private currentRecord: LearningRecord | null = null;
    private currentIndex: number = 0;
    private isVisible: boolean = false;
    private isBossMode: boolean = false;
    
    // 伪装日志模板
    private readonly logTemplates = [
        // 模板1: 模块加载风格
        (word: Word, record: LearningRecord | null) => {
            const time = new Date().toISOString().split('T')[1].split('.')[0];
            return `[${time}] [INFO] Module "${word.word}" loaded successfully`;
        },
        // 模板2: 变量初始化风格
        (word: Word, record: LearningRecord | null) => {
            const time = new Date().toISOString().split('T')[1].split('.')[0];
            return `[${time}] [DEBUG] Variable "${word.phonetic}" initialized`;
        },
        // 模板3: 配置信息风格
        (word: Word, record: LearningRecord | null) => {
            const time = new Date().toISOString().split('T')[1].split('.')[0];
            return `[${time}] [CONFIG] ${word.meaning}`;
        },
        // 模板4: 内存/状态风格
        (word: Word, record: LearningRecord | null) => {
            const time = new Date().toISOString().split('T')[1].split('.')[0];
            const example = word.example ? ` | ${word.example.substring(0, 50)}` : '';
            return `[${time}] [STATUS] ${word.word}=${word.phonetic}${example}`;
        },
        // 模板5: 网络请求风格
        (word: Word, record: LearningRecord | null) => {
            const time = new Date().toISOString().split('T')[1].split('.')[0];
            const id = Math.floor(Math.random() * 9000) + 1000;
            return `[${time}] [HTTP] Request #${id}: ${word.word} -> ${word.meaning.substring(0, 30)}`;
        },
        // 模板6: 构建输出风格
        (word: Word, record: LearningRecord | null) => {
            const time = new Date().toISOString().split('T')[1].split('.')[0];
            return `[${time}] [BUILD] Compiling "${word.word}"... ${word.phonetic}`;
        },
        // 模板7: 数据库风格
        (word: Word, record: LearningRecord | null) => {
            const time = new Date().toISOString().split('T')[1].split('.')[0];
            const status = record?.status === 'mastered' ? 'cached' : 'fetched';
            return `[${time}] [DB] Record ${status}: ${word.word} | ${word.meaning.substring(0, 25)}`;
        },
        // 模板8: 函数调用风格
        (word: Word, record: LearningRecord | null) => {
            const time = new Date().toISOString().split('T')[1].split('.')[0];
            return `[${time}] [TRACE] ${word.word}(${word.phonetic}) => ${word.meaning.substring(0, 30)}`;
        }
    ];
    
    constructor(wordService: WordService) {
        this.wordService = wordService;
        // 创建一个看起来像调试控制台的输出通道
        this.outputChannel = vscode.window.createOutputChannel('Debug Console', 'log');
    }
    
    /**
     * 显示单词（伪装成日志）
     */
    showWord(word: Word, record: LearningRecord | null = null, index?: number) {
        this.currentWord = word;
        this.currentRecord = record;
        if (index !== undefined) {
            this.currentIndex = index;
        }
        
        if (this.isBossMode) {
            return; // 老板键激活时不显示
        }
        
        // 一行显示完整的单词信息
        const time = new Date().toISOString().split('T')[1].split('.')[0];
        const status = record?.status === 'mastered' ? '[已掌握]' : record?.status === 'favorite' ? '[生词本]' : '';
        const logLine = `[${time}] ${word.word} ${word.phonetic} ${word.meaning} ${status}`;
        
        // 追加到输出通道
        this.outputChannel.appendLine(logLine);
        
        // 如果当前可见，确保显示
        if (this.isVisible) {
            this.outputChannel.show(true);
        }
    }
    
    /**
     * 显示完整单词详情（多行日志形式）
     */
    showWordDetail(word: Word, record: LearningRecord | null = null) {
        if (this.isBossMode) {
            return;
        }
        
        const time = new Date().toISOString().split('T')[1].split('.')[0];
        
        // 清空前先保存当前内容（可选，这里选择清空以显示新单词详情）
        this.outputChannel.clear();
        
        // 输出伪装成堆栈跟踪或对象结构的详情
        this.outputChannel.appendLine(`[${time}] [VERBOSE] WordDetails {`);
        this.outputChannel.appendLine(`[${time}]   word: "${word.word}",`);
        this.outputChannel.appendLine(`[${time}]   phonetic: "${word.phonetic}",`);
        this.outputChannel.appendLine(`[${time}]   meaning: "${word.meaning}",`);
        
        if (word.example) {
            this.outputChannel.appendLine(`[${time}]   example: "${word.example}",`);
        }
        if (word.exampleTrans) {
            this.outputChannel.appendLine(`[${time}]   translation: "${word.exampleTrans}",`);
        }
        
        // 艾宾浩斯复习信息
        if (record) {
            this.outputChannel.appendLine(`[${time}]   status: "${record.status}",`);
            this.outputChannel.appendLine(`[${time}]   reviews: ${record.reviewCount},`);
            if (record.nextReviewTime) {
                const nextReview = new Date(record.nextReviewTime).toLocaleString('zh-CN');
                this.outputChannel.appendLine(`[${time}]   nextReview: "${nextReview}"`);
            }
        }
        
        this.outputChannel.appendLine(`[${time}] }`);
        this.outputChannel.appendLine(''); // 空行分隔
        
        if (this.isVisible) {
            this.outputChannel.show(true);
        }
    }
    
    /**
     * 显示/隐藏控制台
     */
    toggleVisibility(): boolean {
        this.isVisible = !this.isVisible;
        
        if (this.isVisible && !this.isBossMode) {
            this.outputChannel.show(true);
        } else {
            // VS Code 没有直接隐藏 OutputChannel 的方法，只能清空内容
            // 但我们可以通过显示其他面板来"隐藏"它
            // 或者简单地清空内容
            this.outputChannel.clear();
        }
        
        return this.isVisible;
    }
    
    /**
     * 显示控制台
     */
    show() {
        if (!this.isBossMode) {
            this.isVisible = true;
            this.outputChannel.show(true);
        }
    }
    
    /**
     * 隐藏控制台（清空内容）
     */
    hide() {
        this.isVisible = false;
        this.outputChannel.clear();
    }
    
    /**
     * 老板键模式切换
     */
    toggleBossMode(): boolean {
        this.isBossMode = !this.isBossMode;
        
        if (this.isBossMode) {
            // 清空输出，伪装成正常控制台
            this.outputChannel.clear();
            this.outputChannel.appendLine(`[${new Date().toISOString().split('T')[1].split('.')[0]}] [INFO] Debugging session started...`);
            this.outputChannel.appendLine(`[${new Date().toISOString().split('T')[1].split('.')[0]}] [INFO] Waiting for breakpoints...`);
        } else if (this.isVisible && this.currentWord) {
            // 恢复显示当前单词
            this.showWordDetail(this.currentWord, this.currentRecord);
        }
        
        return this.isBossMode;
    }
    
    /**
     * 获取当前老板键状态
     */
    isHidden(): boolean {
        return this.isBossMode;
    }
    
    /**
     * 获取当前显示的单词
     */
    getCurrentWord(): Word | null {
        return this.currentWord;
    }
    
    /**
     * 获取当前单词索引
     */
    getCurrentIndex(): number {
        return this.currentIndex;
    }
    
    /**
     * 更新学习记录（用于刷新显示）
     */
    updateRecord(record: LearningRecord | null) {
        this.currentRecord = record;
    }
    
    /**
     * 清空控制台
     */
    clear() {
        this.outputChannel.clear();
    }
    
    /**
     * 输出伪装成错误的提示（用于重要提醒）
     */
    appendImportant(message: string) {
        if (!this.isBossMode) {
            const time = new Date().toISOString().split('T')[1].split('.')[0];
            this.outputChannel.appendLine(`[${time}] [WARN] ${message}`);
            if (this.isVisible) {
                this.outputChannel.show(true);
            }
        }
    }
    
    dispose() {
        this.outputChannel.dispose();
    }
}
