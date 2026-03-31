export interface Word {
    id: string;
    word: string;
    phonetic: string;
    meaning: string;
    example?: string;
    exampleTrans?: string;
}

export interface Wordbook {
    id: string;
    name: string;
    words: Word[];
}

export interface LearningRecord {
    wordId: string;
    wordbookId: string;
    status: 'new' | 'learning' | 'mastered' | 'favorite';
    reviewCount: number;
    lastReviewTime: number;
    // 艾宾浩斯遗忘曲线相关
    nextReviewTime?: number;  // 下次复习时间
    ebbinghausStage?: number; // 当前复习阶段 (0-7)
}

// 艾宾浩斯遗忘曲线复习间隔（分钟）
export const EBBINGHAUS_INTERVALS = [
    5,      // 第1次复习：5分钟后
    30,     // 第2次复习：30分钟后
    12 * 60,    // 第3次复习：12小时后
    24 * 60,    // 第4次复习：1天后
    2 * 24 * 60, // 第5次复习：2天后
    4 * 24 * 60, // 第6次复习：4天后
    7 * 24 * 60, // 第7次复习：7天后
    15 * 24 * 60 // 第8次复习：15天后
];

export interface PluginState {
    isBossMode: boolean;
    currentWordIndex: number;
    currentWordbookId: string;
    timerId: NodeJS.Timeout | null;
}
