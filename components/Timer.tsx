import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from './Card';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TimerSession } from '../types';

const TimerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 00-1.866 0L9.233 16a1 1 0 001.866 0l.834-3.2zM12 21a9 9 0 110-18 9 9 0 010 18z" />
    </svg>
);

type TimerMode = 'Custom' | 'Pomodoro';
type PomodoroState = 'Focus' | 'Short Break' | 'Long Break';

const POMODORO_DURATIONS: Record<PomodoroState, number> = {
  'Focus': 25,
  'Short Break': 5,
  'Long Break': 15,
};

const POMODORO_COLORS: Record<PomodoroState, { circle: string, text: string }> = {
    'Focus': { circle: 'text-cyan-500', text: 'text-cyan-500' },
    'Short Break': { circle: 'text-green-500', text: 'text-green-500' },
    'Long Break': { circle: 'text-indigo-500', text: 'text-indigo-500' },
};

export const Timer: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>('Custom');
  const [customDuration, setCustomDuration] = useState(30);
  const [secondsLeft, setSecondsLeft] = useState(customDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [taskName, setTaskName] = useState('');
  
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>('Focus');
  const [pomodoroCycle, setPomodoroCycle] = useState(0);

  const [timerSessions, setTimerSessions] = useLocalStorage<TimerSession[]>('timerSessions', []);

  const intervalRef = useRef<number | null>(null);

  const currentDurationInMinutes = mode === 'Custom' ? customDuration : POMODORO_DURATIONS[pomodoroState];
  const currentColors = mode === 'Pomodoro' ? POMODORO_COLORS[pomodoroState] : { circle: 'text-cyan-500', text: 'text-cyan-500' };

  const logSession = useCallback(() => {
    const session: TimerSession = {
      taskName: mode === 'Pomodoro' ? `Pomodoro: ${pomodoroState}` : taskName || 'Unnamed Task',
      duration: currentDurationInMinutes * 60,
      completedAt: Date.now(),
    };
    setTimerSessions([...timerSessions, session]);
  }, [taskName, mode, pomodoroState, currentDurationInMinutes, timerSessions, setTimerSessions]);

  const resetTimer = useCallback((shouldResetPomodoro = true) => {
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
    setIsRunning(false);
    if (mode === 'Pomodoro') {
        if (shouldResetPomodoro) {
          setPomodoroState('Focus');
          setPomodoroCycle(0);
        }
        setSecondsLeft(POMODORO_DURATIONS[pomodoroState] * 60);
    } else {
        setSecondsLeft(customDuration * 60);
    }
  }, [mode, customDuration, pomodoroState]);

  useEffect(() => {
    resetTimer();
  }, [mode, customDuration, resetTimer]);
  
  const advancePomodoro = useCallback(() => {
    if (pomodoroState === 'Focus') {
      logSession();
      const nextCycle = pomodoroCycle + 1;
      if (nextCycle === 4) {
        setPomodoroState('Long Break');
        setSecondsLeft(POMODORO_DURATIONS['Long Break'] * 60);
        setPomodoroCycle(0);
        alert("4 Focus sessions complete! Time for a long break.");
      } else {
        setPomodoroState('Short Break');
        setSecondsLeft(POMODORO_DURATIONS['Short Break'] * 60);
        setPomodoroCycle(nextCycle);
        alert("Focus session complete! Time for a short break.");
      }
    } else {
      setPomodoroState('Focus');
      setSecondsLeft(POMODORO_DURATIONS['Focus'] * 60);
      alert("Break's over! Time to focus.");
    }
    setIsRunning(false);
  }, [pomodoroCycle, pomodoroState, logSession]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            if(intervalRef.current) clearInterval(intervalRef.current);
            if (mode === 'Pomodoro') {
                advancePomodoro();
            } else {
                logSession();
                alert(`Time's up for: ${taskName || 'your task'}!`);
                setIsRunning(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if(intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, taskName, mode, advancePomodoro, logSession]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const totalSeconds = currentDurationInMinutes * 60;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const offset = circumference * (1 - progress);

  return (
    <Card title="Task Timer" icon={<TimerIcon />}>
      <div className="flex flex-col items-center justify-between h-full space-y-4">
        <div className="flex bg-slate-200/50 p-1 rounded-lg">
            <button onClick={() => setMode('Custom')} className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${mode === 'Custom' ? 'bg-cyan-500 text-white' : 'text-slate-600 hover:bg-slate-300/50'}`}>Custom</button>
            <button onClick={() => setMode('Pomodoro')} className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${mode === 'Pomodoro' ? 'bg-cyan-500 text-white' : 'text-slate-600 hover:bg-slate-300/50'}`}>Pomodoro</button>
        </div>

        {mode === 'Pomodoro' ? (
            <div className="text-center">
                <p className={`font-semibold ${currentColors.text}`}>{pomodoroState}</p>
                {pomodoroState === 'Focus' && <p className="text-sm text-slate-500">Cycle {pomodoroCycle + 1} of 4</p>}
            </div>
        ) : (
            <input 
                type="text" 
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Name your task..."
                className="w-full bg-slate-200/50 border border-slate-300 rounded-md px-3 py-2 text-center text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
            />
        )}
        
        <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-slate-300" strokeWidth="7" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
                <circle
                    className={`${currentColors.circle} transition-colors duration-500`}
                    strokeWidth="7"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                    style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 1s linear' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-4xl font-mono font-bold ${currentColors.text} transition-colors duration-500`}>
                    {formatTime(secondsLeft)}
                </span>
            </div>
        </div>
        
        {mode === 'Custom' && (
            <div className="flex items-center space-x-2">
            <label htmlFor="duration" className="text-sm text-slate-500">Duration:</label>
            <input
                id="duration"
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 bg-slate-200/50 border border-slate-300 rounded-md px-2 py-1 text-center focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                disabled={isRunning}
            />
            <span className="text-sm text-slate-500">min</span>
            </div>
        )}
        
        <div className="flex space-x-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-6 py-2 rounded-md font-semibold transition-all duration-200 ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'} text-white shadow-md w-28`}
          >
            {isRunning ? 'Pause' : (secondsLeft > 0 ? 'Start' : 'Begin')}
          </button>
          <button
            onClick={() => resetTimer(true)}
            className="px-6 py-2 rounded-md font-semibold bg-red-500 hover:bg-red-600 text-white shadow-md transition-all duration-200 w-28"
          >
            Reset
          </button>
        </div>
      </div>
    </Card>
  );
};