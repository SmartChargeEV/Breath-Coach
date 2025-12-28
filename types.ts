export enum AppState {
    START = 'START',
    SESSION = 'SESSION',
    SCORE = 'SCORE',
}

export interface BreathData {
    timestamp: number;
}

export interface SessionData {
    breaths: BreathData[];
    duration: number;
}

export interface Score {
    resonance: number;
    rhythm: number;
    avgBPM: number;
}
