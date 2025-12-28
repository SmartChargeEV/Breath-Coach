import React, { useState, useCallback, useEffect, useRef } from 'react';

const speak = (text: string, lang = 'en-US') => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    }
};

const HumanSilhouette = () => (
    <svg viewBox="0 0 200 100" className="w-64 h-32 mx-auto my-2 text-indigo-400">
        <circle cx="100" cy="15" r="10" fill="currentColor" />
        <path d="M100,25 Q90,50 90,70 L85,95 H115 L110,70 Q110,50 100,25 Z" fill="currentColor" />
        <path d="M90,50 C70,45 60,60 50,65" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M110,50 C130,45 140,60 150,65" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        <rect x="92" y="65" width="16" height="10" rx="2" fill="rgba(103, 232, 249, 0.2)" stroke="#67e8f9" strokeWidth="0.5" />
    </svg>
);

interface SpiritLevelProps {
    beta: number | null;
    gamma: number | null;
}

const SpiritLevel: React.FC<SpiritLevelProps> = ({ beta, gamma }) => {
    const isFlat = beta !== null && gamma !== null && Math.abs(beta) < 5 && Math.abs(gamma) < 5;
    const clampedGamma = Math.max(-15, Math.min(15, gamma || 0));
    const clampedBeta = Math.max(-15, Math.min(15, beta || 0));
    const dotX = 50 + clampedGamma * 1.5;
    const dotY = 50 + clampedBeta * 1.5;

    return (
        <div className="my-4 flex flex-col items-center">
            <svg viewBox="0 0 100 100" className="w-24 h-24">
                <circle cx="50" cy="50" r="45" fill="rgba(0,0,0,0.2)" />
                <circle cx="50" cy="50" r="40" stroke={isFlat ? '#67e8f9' : '#4f46e5'} strokeWidth="2" fill="transparent" style={{ transition: 'stroke 0.3s ease-in-out' }} />
                <circle cx="50" cy="50" r="5" stroke="#a5b4fc" strokeWidth="1" fill="transparent" />
                <circle cx={dotX} cy={dotY} r="8" fill={isFlat ? '#67e8f9' : '#a5b4fc'} style={{ transition: 'cx 0.1s ease-out, cy 0.1s ease-out, fill 0.3s ease-in-out' }} />
            </svg>
        </div>
    );
};

interface StartScreenProps {
    onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    const [permissionState, setPermissionState] = useState('idle');
    const [orientation, setOrientation] = useState<{ beta: number | null, gamma: number | null }>({ beta: null, gamma: null });
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isStabilizing, setIsStabilizing] = useState(false);
    
    const isFlat = orientation.beta !== null && orientation.gamma !== null && Math.abs(orientation.beta) < 5 && Math.abs(orientation.gamma) < 5;
    const stabilityTimerRef = useRef<number | null>(null);

    const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
        setOrientation({ beta: event.beta, gamma: event.gamma });
    }, []);

    const requestPermission = useCallback(async () => {
        setError(null);
        setPermissionState('requesting');
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission();
                if (permission === 'granted') {
                    setPermissionState('granted');
                    window.addEventListener('deviceorientation', handleDeviceOrientation);
                } else {
                    setPermissionState('denied');
                    setError('Sensor access denied. Please enable it in your browser settings.');
                }
            } catch (err) {
                setPermissionState('denied');
                setError('An error occurred while requesting sensor access.');
            }
        } else {
            setPermissionState('granted');
            window.addEventListener('deviceorientation', handleDeviceOrientation);
        }
    }, [handleDeviceOrientation]);

    useEffect(() => {
        if (stabilityTimerRef.current) clearTimeout(stabilityTimerRef.current);

        if (permissionState !== 'granted' || !isFlat) {
            setIsStabilizing(false);
            if (countdown !== null) setCountdown(null);
            return;
        }

        if (countdown === null && !isStabilizing) {
            setIsStabilizing(true);
            stabilityTimerRef.current = window.setTimeout(() => {
                setIsStabilizing(false);
                setCountdown(3);
                speak("3");
            }, 2000);
        }
    }, [isFlat, permissionState, countdown, isStabilizing]);

    useEffect(() => {
        if (countdown === null) return;
        if (countdown === 0) {
            onStart();
            return;
        }

        const timerId = setTimeout(() => {
            const nextCount = countdown - 1;
            if (nextCount > 0) speak(String(nextCount));
            setCountdown(nextCount);
        }, 1000);

        return () => clearTimeout(timerId);
    }, [countdown, onStart]);
    
    useEffect(() => {
        return () => window.removeEventListener('deviceorientation', handleDeviceOrientation);
    }, [handleDeviceOrientation]);
    
    const renderStatus = () => {
        if (countdown !== null) {
            return <p className="text-8xl font-bold text-cyan-400">{countdown}</p>;
        }
        if (isStabilizing) {
            return <p className="font-semibold text-blue-300">Hold steady...</p>;
        }
        if (orientation.beta === null) {
           return <p className="font-semibold text-yellow-300">Place phone on your belly...</p>;
        }
        return <p className="font-semibold text-yellow-300">Level the phone until the ring is green.</p>;
    };

    return (
        <div className="w-full max-w-md mx-auto text-center p-8 bg-indigo-800/50 rounded-2xl shadow-2xl backdrop-blur-lg border border-indigo-700/50">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2 tracking-wide">BreathCoach</h1>
            <p className="text-indigo-200 mb-4">Lie down and place your phone on the highlighted area.</p>
            
            <HumanSilhouette />
            <SpiritLevel beta={orientation.beta} gamma={orientation.gamma} />

            {error && <p className="text-red-400 mt-4">{error}</p>}
            {permissionState !== 'granted' ? (
                <button onClick={requestPermission} disabled={permissionState === 'requesting'} className="mt-4 w-full bg-cyan-500 text-indigo-900 font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50">
                    {permissionState === 'requesting' ? 'Requesting...' : 'Allow Sensor Access'}
                </button>
            ) : (
                <div className="mt-4 h-20 flex items-center justify-center text-lg">
                    {renderStatus()}
                </div>
            )}
        </div>
    );
};

export default StartScreen;
