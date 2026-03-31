import * as vscode from 'vscode';
import { WordService } from './wordService';
import { StatusBarManager } from './statusBarManager';
import { ConsoleManager } from './consoleManager';
import { DetailPanel } from './detailPanel';
import { LearningRecord, Word } from './types';

let statusBarManager: StatusBarManager | null = null;
let consoleManager: ConsoleManager | null = null;
let wordService: WordService | null = null;

// 显示模式
let displayMode: 'statusbar' | 'console' | 'both' | 'none' = 'console';
let isBossMode: boolean = false;

export function activate(context: vscode.ExtensionContext) {
    console.log('[摸鱼背单词] 插件开始激活...');
    
    try {
        wordService = new WordService(context);
        statusBarManager = new StatusBarManager(wordService);
        consoleManager = new ConsoleManager(wordService);
        console.log('[摸鱼背单词] 服务初始化成功');
    } catch (error) {
        console.error('[摸鱼背单词] 插件激活失败:', error);
        vscode.window.showErrorMessage(`摸鱼背单词插件激活失败: ${error}`);
        return;
    }
    
    // 默认使用控制台模式
    initDisplayMode();
    console.log('[摸鱼背单词] 显示模式已初始化');
    
    const commands = [
        // 上一个单词 - 顺序模式
        vscode.commands.registerCommand('fishVocab.previousWord', () => {
            if (isBossMode) return;
            
            // 状态栏模式：使用顺序上一个
            if (statusBarManager && displayMode !== 'console' && displayMode !== 'none') {
                statusBarManager.previousWord();
            }
            
            // 控制台模式：使用顺序上一个
            if ((displayMode === 'console' || displayMode === 'both') && consoleManager && wordService) {
                const currentIndex = consoleManager.getCurrentIndex();
                const newIndex = currentIndex - 1;
                const prevWord = wordService.getWordByIndex(newIndex);
                if (prevWord) {
                    const record = wordService.getRecord(prevWord.id);
                    consoleManager.showWord(prevWord, record || null, newIndex);
                }
            }
            
            updateDetailPanel();
        }),
        
        // 下一个单词 - 顺序模式
        vscode.commands.registerCommand('fishVocab.nextWord', () => {
            if (isBossMode) return;
            
            // 状态栏模式：使用顺序下一个
            if (statusBarManager && displayMode !== 'console' && displayMode !== 'none') {
                statusBarManager.nextWord();
            }
            
            // 控制台模式：使用顺序下一个
            if ((displayMode === 'console' || displayMode === 'both') && consoleManager && wordService) {
                const currentIndex = consoleManager.getCurrentIndex();
                const newIndex = currentIndex + 1;
                const nextWord = wordService.getWordByIndex(newIndex);
                if (nextWord) {
                    const record = wordService.getRecord(nextWord.id);
                    consoleManager.showWord(nextWord, record || null, newIndex);
                }
            }
            
            updateDetailPanel();
        }),
        
        // 老板键
        vscode.commands.registerCommand('fishVocab.toggleBossKey', () => {
            toggleBossMode();
        }),
        
        // 选择词库
        vscode.commands.registerCommand('fishVocab.selectWordbook', async () => {
            if (!wordService) return;
            
            const wordbooks = wordService.getWordbookList();
            const items = wordbooks.map(wb => ({
                label: wb.name,
                description: wb.id,
                id: wb.id
            }));
            
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: '选择要学习的词库'
            });
            
            if (selected) {
                wordService.setCurrentWordbook(selected.id);
                const nextWord = wordService.getRecommendedWord();
                if (nextWord) {
                    showWord(nextWord);
                }
                consoleManager?.appendImportant(`已切换到: ${selected.label}`);
            }
        }),
        
        // 切换显示模式
        vscode.commands.registerCommand('fishVocab.switchDisplayMode', async () => {
            const modes = [
                { label: '终端: 仅控制台模式', value: 'console' },
                { label: '列表筛选: 仅状态栏模式', value: 'statusbar' },
                { label: '全屏: 状态栏+控制台', value: 'both' },
                { label: '禁止: 完全隐藏', value: 'none' }
            ];
            
            const selected = await vscode.window.showQuickPick(modes, {
                placeHolder: '选择单词显示模式'
            });
            
            if (selected) {
                setDisplayMode(selected.value as typeof displayMode);
            }
        }),
        
        // 显示详情
        vscode.commands.registerCommand('fishVocab.showDetail', () => {
            if (isBossMode) return;
            
            const currentWord = getCurrentWord();
            if (currentWord && wordService) {
                const record = wordService.getRecord(currentWord.id);
                DetailPanel.show(currentWord, record || null, context.extensionUri);
            }
        }),
        
        // 标记为已掌握
        vscode.commands.registerCommand('fishVocab.markMastered', async () => {
            await handleMarkWord('mastered');
        }),
        
        // 加入生词本
        vscode.commands.registerCommand('fishVocab.addToFavorites', async () => {
            await handleMarkWord('favorite');
        }),
        
        // 查看生词本
        vscode.commands.registerCommand('fishVocab.viewFavorites', async () => {
            if (!wordService) return;
            
            const favorites = wordService.getFavoriteWords();
            if (favorites.length === 0) {
                consoleManager?.appendImportant('生词本为空');
                return;
            }
            
            const items = favorites.map(({ word, record }) => ({
                label: word.word,
                description: word.meaning.substring(0, 30),
                detail: `复习${record.reviewCount || 0}次`,
                word: word
            }));
            
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: `生词本 (${favorites.length}个)`
            });
            
            if (selected) {
                showWord(selected.word);
            }
        }),
        
        // 学习统计
        vscode.commands.registerCommand('fishVocab.showStats', () => {
            if (!wordService) return;
            
            const stats = wordService.getLearningStats();
            consoleManager?.appendImportant(`统计: 总${stats.totalWords} 掌握${stats.masteredCount} 生词${stats.favoriteCount} 新词${stats.newCount} 待复习${stats.reviewDueCount}`);
        }),
        
        // 开始复习
        vscode.commands.registerCommand('fishVocab.startReview', () => {
            if (!wordService) return;
            
            const wordsToReview = wordService.getWordsToReview();
            
            if (wordsToReview.length === 0) {
                consoleManager?.appendImportant('没有需要复习的单词');
                return;
            }
            
            const firstWord = wordsToReview[0].word;
            showWord(firstWord);
            DetailPanel.show(firstWord, wordsToReview[0].record, context.extensionUri);
            consoleManager?.appendImportant(`开始复习: ${wordsToReview.length}个待复习`);
        }),
        
        // 显示/隐藏控制台
        vscode.commands.registerCommand('fishVocab.toggleConsole', () => {
            consoleManager?.toggleVisibility();
        })
    ];
    
    // 右键菜单
    const statusBarMenu = vscode.commands.registerCommand('fishVocab.showMenu', () => {
        const items = [
            { label: '上一词 (Alt+←)', command: 'fishVocab.previousWord' },
            { label: '下一词 (Alt+→)', command: 'fishVocab.nextWord' },
            { label: '老板键 (Ctrl+Alt+E)', command: 'fishVocab.toggleBossKey' },
            { label: '选择词库', command: 'fishVocab.selectWordbook' },
            { label: '切换显示模式', command: 'fishVocab.switchDisplayMode' },
            { label: '查看生词本', command: 'fishVocab.viewFavorites' },
            { label: '学习统计', command: 'fishVocab.showStats' },
            { label: '开始复习', command: 'fishVocab.startReview' }
        ];
        
        vscode.window.showQuickPick(items, { placeHolder: '摸鱼背单词' }).then(selected => {
            if (selected) {
                vscode.commands.executeCommand(selected.command);
            }
        });
    });
    
    context.subscriptions.push(...commands, statusBarMenu);
    console.log('[摸鱼背单词] 命令注册成功，共', commands.length + 1, '个命令');
    
    // 显示欢迎信息
    const wordbook = wordService.getCurrentWordbook();
    if (wordbook) {
        consoleManager?.appendImportant(`摸鱼背单词已启动: ${wordbook.name} ${wordbook.words.length}词`);
        console.log(`[摸鱼背单词] 当前词库: ${wordbook.name}, ${wordbook.words.length}个单词`);
    } else {
        console.log('[摸鱼背单词] 警告: 没有加载词库');
    }
    
    console.log('[摸鱼背单词] 插件激活完成！快捷键: Alt+Q上一词 Alt+W下一词 Alt+E老板键');
}

// 初始化显示模式
function initDisplayMode() {
    setDisplayMode('console');
}

// 设置显示模式
function setDisplayMode(mode: typeof displayMode) {
    displayMode = mode;
    
    // 根据模式显示/隐藏
    switch (mode) {
        case 'console':
            statusBarManager?.hide();
            if (!isBossMode) consoleManager?.show();
            break;
        case 'statusbar':
            statusBarManager?.show();
            consoleManager?.hide();
            break;
        case 'both':
            statusBarManager?.show();
            if (!isBossMode) consoleManager?.show();
            break;
        case 'none':
            statusBarManager?.hide();
            consoleManager?.hide();
            break;
    }
}

// 获取当前单词
function getCurrentWord() {
    return statusBarManager?.getCurrentWord() || consoleManager?.getCurrentWord() || null;
}

// 显示单词
function showWord(word: Word) {
    if (isBossMode) return;
    
    const record = wordService?.getRecord(word.id);
    
    if (displayMode !== 'console' && displayMode !== 'none') {
        statusBarManager?.showWord(word);
    }
    
    if ((displayMode === 'console' || displayMode === 'both') && consoleManager) {
        consoleManager.showWord(word, record || null);
    }
}

// 从状态栏更新控制台
function updateConsoleFromStatusBar() {
    if (displayMode === 'console' || displayMode === 'both') {
        const word = statusBarManager?.getCurrentWord();
        if (word && consoleManager) {
            const record = wordService?.getRecord(word.id);
            consoleManager.showWord(word, record || null);
        }
    }
}

// 老板键切换
function toggleBossMode() {
    isBossMode = !isBossMode;
    
    // 同时控制状态栏和控制台
    if (statusBarManager) {
        statusBarManager.toggleBossMode();
    }
    
    if (consoleManager) {
        consoleManager.toggleBossMode();
    }
    
    // 关闭详情面板
    if (isBossMode) {
        DetailPanel.close();
    }
    
    return isBossMode;
}

// 检查老板键是否激活
function isBossModeActive(): boolean {
    return isBossMode;
}

// 更新详情面板
function updateDetailPanel() {
    const currentWord = getCurrentWord();
    if (currentWord && DetailPanel.currentPanel && wordService) {
        const record = wordService.getRecord(currentWord.id);
        DetailPanel.currentPanel.update(currentWord, record || null);
    }
}

// 处理标记单词
async function handleMarkWord(status: 'mastered' | 'favorite') {
    if (!wordService) return;
    
    const currentWord = getCurrentWord();
    if (!currentWord) return;
    
    const existingRecord = wordService.getRecord(currentWord.id);
    const wordbook = wordService.getCurrentWordbook();
    
    const record: LearningRecord = {
        wordId: currentWord.id,
        wordbookId: wordbook?.id || '',
        status: status,
        reviewCount: (existingRecord?.reviewCount || 0) + 1,
        lastReviewTime: Date.now(),
        ebbinghausStage: existingRecord?.ebbinghausStage ?? -1
    };
    
    await wordService.saveRecord(record);
    
    const msg = status === 'mastered' ? `已掌握: ${currentWord.word}` : `已加入生词本: ${currentWord.word}`;
    consoleManager?.appendImportant(msg);
    
    // 自动下一个
    if (status === 'mastered') {
        const nextWord = wordService.getRecommendedWord(currentWord.id);
        if (nextWord) {
            showWord(nextWord);
            updateDetailPanel();
        }
    }
}

export function deactivate() {
    statusBarManager?.dispose();
    consoleManager?.dispose();
    wordService = null;
}
