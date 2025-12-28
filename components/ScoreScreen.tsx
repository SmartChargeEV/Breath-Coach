import React, { useMemo, useEffect } from 'react';
import { SessionData } from '../types';
import { calculateResonanceScore } from '../utils/breathingAnalyzer';

const speak = (text: string, lang = 'en-US') => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    }
};

interface ScoreCircleProps {
    score: number;
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({ score }) => {
    const circumference = 2 * Math.PI * 56;
    const offset = circumference - (score / 100) * circumference;
    return (
        <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle className="text-indigo-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="56" cx="60" cy="60" />
                <circle className="text-cyan-400" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r="56" cx="60" cy="60" style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }} transform="rotate(-90 60 60)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white">{Math.round(score)}</span>
                <span className="text-sm text-indigo-300">Score</span>
            </div>
        </div>
    );
};


interface ScoreScreenProps {
    sessionData: SessionData;
    onRestart: () => void;
}

const ScoreScreen: React.FC<ScoreScreenProps> = ({ sessionData, onRestart }) => {
    const score = useMemo(() => calculateResonanceScore(sessionData), [sessionData]);
    
    useEffect(() => {
        speak("Session complete. Here is your resonance score.");
    }, []);
    
    const feedback = useMemo(() => {
        if (score.resonance >= 85) return "Excellent! You've achieved a state of high resonance.";
        if (score.resonance >= 70) return "Great job! Your breathing is calm and consistent.";
        if (score.resonance >= 50) return "Good effort. Try to maintain a more steady rhythm.";
        return "Keep practicing. Focus on slow, regular belly breaths.";
    }, [score.resonance]);

    return (
        <div className="w-full max-w-md mx-auto text-center p-8 bg-indigo-800/50 rounded-2xl shadow-2xl backdrop-blur-lg border border-indigo-700/50">
            <h2 className="text-3xl font-bold text-cyan-400 mb-2">Session Complete</h2>
            <p className="text-indigo-200 mb-8">{feedback}</p>
            <div className="flex justify-center mb-8"><ScoreCircle score={score.resonance} /></div>
            <div className="grid grid-cols-2 gap-4 text-left p-6 bg-indigo-900/60 rounded-lg border border-indigo-700/60">
                <div><p className="text-sm text-indigo-300">Avg. Breath Rate</p><p className="text-2xl font-bold text-white">{score.avgBPM.toFixed(1)} <span className="text-lg font-normal">BPM</span></p></div>
                <div><p className="text-sm text-indigo-300">Rhythm Score</p><p className="text-2xl font-bold text-white">{Math.round(score.rhythm)}<span className="text-lg font-normal">/100</span></p></div>
            </div>
            <button onClick={onRestart} className="mt-8 w-full bg-cyan-500 text-indigo-900 font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 ease-in-out transform hover:scale-105">Try Another Session</button>
        </div>
    );
};

export default ScoreScreen;
