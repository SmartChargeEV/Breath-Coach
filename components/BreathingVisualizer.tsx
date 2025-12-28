import React, { useMemo } from 'react';

interface BreathingVisualizerProps {
    data: number[];
}

const BreathingVisualizer: React.FC<BreathingVisualizerProps> = ({ data }) => {
    const pathData = useMemo(() => {
        if (data.length < 2) return 'M 0 50 L 100 50';
        const width = 100, height = 100, step = width / (data.length - 1);
        const min = Math.min(...data), max = Math.max(...data), range = max - min;
        if (range < 0.01) return `M 0,${height/2} H ${width}`;
        
        let path = `M 0,${height / 2 + (height / 2 - 10) * ((data[0] - min) / range * 2 - 1)}`;
        for (let i = 1; i < data.length; i++) {
            const x = i * step;
            const normalizedValue = (data[i] - min) / range * 2 - 1;
            const y = height / 2 - (height / 2 - 10) * normalizedValue;
            path += ` L ${x.toFixed(2)},${y.toFixed(2)}`;
        }
        return path;
    }, [data]);
    
    return (
        <div className="w-full h-full">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d={pathData} fill="none" stroke="#67e8f9" strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
        </div>
    );
};

export default BreathingVisualizer;
