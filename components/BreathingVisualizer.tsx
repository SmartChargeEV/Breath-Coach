import React, { useState, useEffect, useRef, useMemo } from 'react';

interface BreathingVisualizerProps {
    data: number[];
}

const MAX_POINTS = 200;
const FIXED_MIN = -5;
const FIXED_MAX = 5;

const BreathingVisualizer: React.FC<BreathingVisualizerProps> = ({ data }) => {
    // State for the data points that are actually rendered.
    const [animatedData, setAnimatedData] = useState<number[]>([]);
    // Ref to hold the latest incoming data from props without triggering effect re-runs.
    const targetDataRef = useRef<number[]>(data);
    // Fix: Initialize useRef with null and provide the correct type.
    const animationFrameId = useRef<number | null>(null);

    // Keep the ref updated with the latest data from props.
    useEffect(() => {
        targetDataRef.current = data;
    }, [data]);

    // The main animation loop, runs once on mount.
    useEffect(() => {
        const animate = () => {
            setAnimatedData(currentAnimatedData => {
                const targetData = targetDataRef.current;
                const LERP_FACTOR = 0.2; // Controls the "smoothness". Higher is less smooth.

                // If target is empty (e.g., session reset), reset our animated data.
                if (targetData.length === 0) {
                    return [];
                }
                
                let nextAnimatedData = [...currentAnimatedData];

                // Synchronize lengths if they differ.
                if (nextAnimatedData.length !== targetData.length) {
                    // For growing, add new points initialized to the last known value.
                    if (targetData.length > nextAnimatedData.length) {
                         const lastValue = nextAnimatedData[nextAnimatedData.length - 1] || targetData[nextAnimatedData.length] || 0;
                         const newPoints = Array(targetData.length - nextAnimatedData.length).fill(lastValue);
                         nextAnimatedData.push(...newPoints);
                    } else {
                        // For shrinking or reset, just snap to the new length.
                        nextAnimatedData = nextAnimatedData.slice(0, targetData.length);
                    }
                }

                // Interpolate each point towards its target value.
                for (let i = 0; i < targetData.length; i++) {
                    const current = nextAnimatedData[i];
                    const target = targetData[i];
                    // Lerp (Linear Interpolation)
                    nextAnimatedData[i] = current + (target - current) * LERP_FACTOR;
                }
                
                return nextAnimatedData;
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };

        // Start the animation loop.
        animationFrameId.current = requestAnimationFrame(animate);
        
        // Cleanup on unmount.
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []); // Empty dependency array ensures this effect runs only once.

    const pathData = useMemo(() => {
        const dataToDraw = animatedData;
        if (dataToDraw.length < 2) return 'M 0 50';
        
        const width = 100, height = 100;
        const step = width / (MAX_POINTS - 1);
        const range = FIXED_MAX - FIXED_MIN;

        let path = '';
        for (let i = 0; i < dataToDraw.length; i++) {
            const command = i === 0 ? 'M' : 'L';
            const x = i * step;
            const clampedValue = Math.max(FIXED_MIN, Math.min(FIXED_MAX, dataToDraw[i]));
            const normalizedValue = (clampedValue - FIXED_MIN) / range * 2 - 1;
            const y = height / 2 - (height / 2 - 10) * normalizedValue;
            path += ` ${command} ${x.toFixed(2)},${y.toFixed(2)}`;
        }
        return path.trim();
    }, [animatedData]);
    
    return (
        <div className="w-full h-full">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path 
                    d={pathData} 
                    fill="none" 
                    stroke="#67e8f9" 
                    strokeWidth="0.5" 
                    strokeLinejoin="round" 
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
};

export default BreathingVisualizer;