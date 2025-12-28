import { SessionData, Score } from '../types';

const TARGET_BPM = 6;

export const getStandardDeviation = (arr: number[]): number => {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
    const variance = arr.reduce((acc, val) => acc + (val - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
};

export const calculateResonanceScore = (sessionData: SessionData): Score => {
    const { breaths } = sessionData;
    if (breaths.length < 3) return { resonance: 0, rhythm: 0, avgBPM: 0 };
    
    const intervals: number[] = [];
    for (let i = 1; i < breaths.length; i++) {
        intervals.push((breaths[i].timestamp - breaths[i - 1].timestamp) / 1000);
    }
    
    if (intervals.length === 0) return { resonance: 0, rhythm: 0, avgBPM: 0 };
    
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const avgBPM = 60 / averageInterval;
    
    const freqDifference = Math.abs(avgBPM - TARGET_BPM);
    const frequencyScore = Math.max(0, 100 - (freqDifference / 4) * 100);
    
    const stdDev = getStandardDeviation(intervals);
    const rhythmPenalty = (stdDev / averageInterval) * 400;
    const rhythmScore = Math.max(0, 100 - rhythmPenalty);
    
    const resonance = (frequencyScore * 0.6) + (rhythmScore * 0.4);
    
    return {
        resonance: Math.round(resonance),
        rhythm: Math.round(rhythmScore),
        avgBPM,
    };
};
