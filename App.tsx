import React, { useState, useCallback } from 'react';
import { AppState, SessionData } from './types';
import StartScreen from './components/StartScreen';
import SessionScreen from './components/SessionScreen';
import ScoreScreen from './components/ScoreScreen';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.START);
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    
    const handleSessionStart = useCallback(() => setAppState(AppState.SESSION), []);
    
    const handleSessionComplete = useCallback((data: SessionData) => {
        setSessionData(data);
        setAppState(AppState.SCORE);
    }, []);
    
    const handleRestart = useCallback(() => {
        setSessionData(null);
        setAppState(AppState.START);
    }, []);
    
    const renderContent = () => {
        switch (appState) {
            case AppState.SESSION: 
                return <SessionScreen onSessionComplete={handleSessionComplete} />;
            case AppState.SCORE: 
                return sessionData ? <ScoreScreen sessionData={sessionData} onRestart={handleRestart} /> : <StartScreen onStart={handleSessionStart} />;
            case AppState.START:
            default: 
                return <StartScreen onStart={handleSessionStart} />;
        }
    };
    
    return (
        <main className="bg-gradient-to-br from-indigo-900 to-slate-900 min-h-screen w-full flex flex-col items-center justify-center text-white p-4 font-sans antialiased">
            {renderContent()}
        </main>
    );
};

export default App;
