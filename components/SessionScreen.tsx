import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMotionSensors } from '../hooks/useMotionSensors';
import BreathingVisualizer from './BreathingVisualizer';
import { SessionData, BreathData } from '../types';

const speak = (text: string, lang = 'en-US') => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    }
};

interface SessionScreenProps {
    onSessionComplete: (data: SessionData) => void;
}

const SessionScreen: React.FC<SessionScreenProps> = ({ onSessionComplete }) => {
    const SESSION_DURATION = 60;
    const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
    const { filteredData, breathsPerMinute, recordedBreaths, startListening, stopListening } = useMotionSensors();

    const breathsRef = useRef<BreathData[]>(recordedBreaths);
    useEffect(() => {
        breathsRef.current = recordedBreaths;
    }, [recordedBreaths]);
    
    useEffect(() => {
        let audioContext: AudioContext | null = null, 
            inhaleOsc: OscillatorNode | null = null, 
            exhaleOsc: OscillatorNode | null = null, 
            inhaleGain: GainNode | null = null, 
            exhaleGain: GainNode | null = null;
        let isPlaying = true;
        
        function setupAudio() {
            try {
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                inhaleGain = audioContext.createGain();
                inhaleGain.gain.setValueAtTime(0, audioContext.currentTime);
                inhaleGain.connect(audioContext.destination);

                exhaleGain = audioContext.createGain();
                exhaleGain.gain.setValueAtTime(0, audioContext.currentTime);
                exhaleGain.connect(audioContext.destination);
                
                inhaleOsc = audioContext.createOscillator();
                inhaleOsc.type = 'sine';
                inhaleOsc.frequency.setValueAtTime(392.00, audioContext.currentTime); // G4
                inhaleOsc.connect(inhaleGain);
                inhaleOsc.start();

                exhaleOsc = audioContext.createOscillator();
                exhaleOsc.type = 'sine';
                exhaleOsc.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4
                exhaleOsc.connect(exhaleGain);
                exhaleOsc.start();
            } catch (e) {
                console.error("Failed to initialize Web Audio API", e);
            }
        }

        function playBreathingCycle() {
            if (!isPlaying || !audioContext || !inhaleGain || !exhaleGain) return;
            const now = audioContext.currentTime;
            
            inhaleGain.gain.linearRampToValueAtTime(0.3, now + 0.5);
            inhaleGain.gain.linearRampToValueAtTime(0, now + 4);
            
            exhaleGain.gain.linearRampToValueAtTime(0.3, now + 4.5);
            exhaleGain.gain.linearRampToValueAtTime(0, now + 10);

            setTimeout(playBreathingCycle, 10000);
        }
        
        setupAudio();
        playBreathingCycle();
        speak("Begin breathing. Follow the tones.");

        startListening();
        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    stopListening();
                    onSessionComplete({ breaths: breathsRef.current, duration: SESSION_DURATION });
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            stopListening();
            isPlaying = false;
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close().catch(console.error);
            }
        };
    }, [onSessionComplete, startListening, stopListening]);

    const formattedTime = useMemo(() => `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`, [timeLeft]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center flex-grow relative">
                <div className="absolute top-4 right-4 text-center"><div className="text-indigo-300 text-sm">TIME LEFT</div><div className="text-4xl font-mono font-bold text-cyan-400">{formattedTime}</div></div>
                <div className="absolute top-4 left-4 text-center"><div className="text-indigo-300 text-sm">LIVE RATE</div><div className="text-4xl font-mono font-bold text-cyan-400">{breathsPerMinute.toFixed(1)}</div><div className="text-indigo-300 text-xs">BPM</div></div>
                <div className="w-full h-64 md:h-96"><BreathingVisualizer data={filteredData} /></div>
                <div className="mt-8 text-center"><p className="text-xl text-indigo-200">Breathe slowly and deeply with your belly.</p><p className="text-md text-indigo-400">Follow the audio guide.</p></div>
            </div>
        </div>
    );
};

export default SessionScreen;
