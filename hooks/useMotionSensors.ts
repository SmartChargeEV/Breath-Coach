import { useState, useCallback, useRef } from 'react';
import { BreathData } from '../types';

export const useMotionSensors = () => {
    const [filteredData, setFilteredData] = useState<number[]>([]);
    const [breathsPerMinute, setBreathsPerMinute] = useState(0);
    const [recordedBreaths, setRecordedBreaths] = useState<BreathData[]>([]);
    
    const isListeningRef = useRef(false);
    const animationFrameId = useRef<number | null>(null);
    
    const rawBetaRef = useRef<number | null>(null);
    const baselineRef = useRef<number | null>(null);
    const filteredValueRef = useRef<number | null>(null);
    const lastPeakTimeRef = useRef<number | null>(null);
    const lastDirectionRef = useRef(0);
    const breathTimestampsRef = useRef<number[]>([]);

    const processData = useCallback(() => {
        if (!isListeningRef.current) return;

        const beta = rawBetaRef.current;
        if (beta === null) {
            animationFrameId.current = requestAnimationFrame(processData);
            return;
        }
        
        if (baselineRef.current === null) {
            baselineRef.current = beta;
        }

        const currentRawValue = beta - baselineRef.current;
        
        const LOW_PASS_ALPHA = 0.1; 
        let newFilteredValue = filteredValueRef.current === null
            ? currentRawValue
            : LOW_PASS_ALPHA * currentRawValue + (1 - LOW_PASS_ALPHA) * filteredValueRef.current;
        filteredValueRef.current = newFilteredValue;

        setFilteredData(prev => {
            const newData = [...prev, newFilteredValue];
            return newData.length > 200 ? newData.slice(1) : newData;
        });

        const prevFilteredValue = filteredData.length > 1 ? filteredData[filteredData.length - 2] : 0;
        const currentDirection = Math.sign(newFilteredValue - prevFilteredValue);

        if (currentDirection === -1 && lastDirectionRef.current === 1 && Math.abs(newFilteredValue - prevFilteredValue) > 0.03) {
            const now = Date.now();
            if (lastPeakTimeRef.current === null || (now - lastPeakTimeRef.current) > 2000) {
                breathTimestampsRef.current.push(now);
                setRecordedBreaths(prev => [...prev, { timestamp: now }]);
                if (navigator.vibrate) navigator.vibrate(50);
                lastPeakTimeRef.current = now;
            }
        }
        lastDirectionRef.current = currentDirection;

        const now = Date.now();
        const recentBreaths = breathTimestampsRef.current.filter(t => now - t < 15000);
        if (recentBreaths.length > 1) {
            const secondsElapsed = (recentBreaths[recentBreaths.length - 1] - recentBreaths[0]) / 1000;
            const bpm = (recentBreaths.length - 1) / secondsElapsed * 60;
            setBreathsPerMinute(bpm);
        }
        
        animationFrameId.current = requestAnimationFrame(processData);
    }, [filteredData]);
    
    const handleMotionEvent = useCallback((event: DeviceOrientationEvent) => {
        rawBetaRef.current = event.beta;
    }, []);

    const startListening = useCallback(() => {
        isListeningRef.current = true;
        rawBetaRef.current = null;
        baselineRef.current = null;
        filteredValueRef.current = null;
        lastPeakTimeRef.current = null;
        lastDirectionRef.current = 0;
        breathTimestampsRef.current = [];
        setFilteredData([]);
        setRecordedBreaths([]);
        setBreathsPerMinute(0);
        
        window.addEventListener('deviceorientation', handleMotionEvent);
        animationFrameId.current = requestAnimationFrame(processData);
    }, [handleMotionEvent, processData]);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        window.removeEventListener('deviceorientation', handleMotionEvent);
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    }, [handleMotionEvent]);

    return { filteredData, breathsPerMinute, recordedBreaths, startListening, stopListening };
};
