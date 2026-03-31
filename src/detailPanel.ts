import * as vscode from 'vscode';
import { Word, LearningRecord } from './types';

export class DetailPanel {
    public static currentPanel: DetailPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private word: Word;
    private record: LearningRecord | null = null;
    private disposables: vscode.Disposable[] = [];
    
    private constructor(panel: vscode.WebviewPanel, word: Word, record: LearningRecord | null, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.word = word;
        this.record = record;
        
        this.panel.webview.html = this.getHtmlContent(word, record);
        
        // 监听消息
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'previous':
                        vscode.commands.executeCommand('fishVocab.previousWord');
                        return;
                    case 'next':
                        vscode.commands.executeCommand('fishVocab.nextWord');
                        return;
                    case 'mastered':
                        vscode.commands.executeCommand('fishVocab.markMastered');
                        return;
                    case 'favorite':
                        vscode.commands.executeCommand('fishVocab.addToFavorites');
                        return;
                    case 'close':
                        this.panel.dispose();
                        return;
                }
            },
            null,
            this.disposables
        );
        
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }
    
    public static show(word: Word, record: LearningRecord | null, extensionUri: vscode.Uri) {
        // 如果已有面板，复用
        if (DetailPanel.currentPanel) {
            DetailPanel.currentPanel.panel.reveal(vscode.ViewColumn.Two);
            DetailPanel.currentPanel.update(word, record);
        } else {
            const panel = vscode.window.createWebviewPanel(
                'fishVocabDetail',
                `📖 ${word.word}`,
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            DetailPanel.currentPanel = new DetailPanel(panel, word, record, extensionUri);
        }
    }
    
    public static close() {
        if (DetailPanel.currentPanel) {
            DetailPanel.currentPanel.panel.dispose();
        }
    }
    
    public update(word: Word, record: LearningRecord | null) {
        this.word = word;
        this.record = record;
        this.panel.title = `📖 ${word.word}`;
        this.panel.webview.html = this.getHtmlContent(word, record);
    }
    
    private getHtmlContent(word: Word, record: LearningRecord | null): string {
        const statusText = record ? this.getStatusText(record.status) : '';
        const reviewInfo = record ? this.getReviewInfo(record) : '';
        
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${word.word}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .word-header {
            text-align: center;
            padding: 30px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            margin-bottom: 20px;
        }
        .word-title {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 10px;
            color: var(--vscode-textLink-foreground);
        }
        .phonetic {
            font-size: 18px;
            color: var(--vscode-descriptionForeground);
            font-family: 'Segoe UI', sans-serif;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            margin-top: 10px;
        }
        .status-mastered {
            background: var(--vscode-testing-iconPassed);
            color: white;
        }
        .status-favorite {
            background: var(--vscode-errorForeground);
            color: white;
        }
        .section {
            margin: 20px 0;
            padding: 15px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .meaning {
            font-size: 18px;
            line-height: 1.6;
        }
        .example {
            font-style: italic;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }
        .example-trans {
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 30px;
            justify-content: center;
            flex-wrap: wrap;
        }
        button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: opacity 0.2s;
            min-width: 80px;
        }
        button:hover {
            opacity: 0.8;
        }
        .btn-nav {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-mastered {
            background: var(--vscode-testing-iconPassed);
            color: white;
        }
        .btn-favorite {
            background: var(--vscode-errorForeground);
            color: white;
        }
        .btn-close {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .review-info {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 8px;
        }
    </style>
</head>
<body>
    <div class="word-header">
        <div class="word-title">${word.word}</div>
        <div class="phonetic">${word.phonetic}</div>
        ${statusText}
        ${reviewInfo}
    </div>
    
    <div class="section">
        <div class="section-title">释义</div>
        <div class="meaning">${word.meaning}</div>
    </div>
    
    ${word.example ? `
    <div class="section">
        <div class="section-title">例句</div>
        <div class="example">${word.example}</div>
        ${word.exampleTrans ? `<div class="example-trans">${word.exampleTrans}</div>` : ''}
    </div>
    ` : ''}
    
    <div class="button-group">
        <button class="btn-nav" onclick="previousWord()">◀ 上一个</button>
        <button class="btn-mastered" onclick="mastered()">✓ 已掌握</button>
        <button class="btn-favorite" onclick="favorite()">♥ 生词本</button>
        <button class="btn-nav" onclick="nextWord()">下一个 ▶</button>
        <button class="btn-close" onclick="closePanel()">关闭</button>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function previousWord() {
            vscode.postMessage({ command: 'previous' });
        }
        
        function nextWord() {
            vscode.postMessage({ command: 'next' });
        }
        
        function mastered() {
            vscode.postMessage({ command: 'mastered' });
        }
        
        function favorite() {
            vscode.postMessage({ command: 'favorite' });
        }
        
        function closePanel() {
            vscode.postMessage({ command: 'close' });
        }
    </script>
</body>
</html>`;
    }
    
    private getStatusText(status: string): string {
        if (status === 'mastered') {
            return '<span class="status-badge status-mastered">✓ 已掌握</span>';
        } else if (status === 'favorite') {
            return '<span class="status-badge status-favorite">♥ 生词本</span>';
        }
        return '';
    }
    
    private getReviewInfo(record: LearningRecord): string {
        if (!record.reviewCount || record.reviewCount === 0) {
            return '';
        }
        const date = new Date(record.lastReviewTime).toLocaleDateString('zh-CN');
        return `<div class="review-info">已复习 ${record.reviewCount} 次 · 上次: ${date}</div>`;
    }
    
    dispose() {
        DetailPanel.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
