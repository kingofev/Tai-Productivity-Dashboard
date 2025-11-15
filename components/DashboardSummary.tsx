import React, { useMemo } from 'react';
import { Task, TimerSession } from '../types';

interface DashboardSummaryProps {
  tasks: Task[];
  timerSessions: TimerSession[];
}

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ tasks, timerSessions }) => {
  const WEEKLY_GOAL_MINUTES = 5 * 60; // 5 hours

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = getStartOfWeek(now);

    // Today's Focus
    const todayFocusSeconds = timerSessions
      .filter(session => isSameDay(new Date(session.completedAt), now))
      .reduce((total, session) => total + session.duration, 0);
    const todayFocusMinutes = Math.floor(todayFocusSeconds / 60);

    // Tasks Done Today
    const tasksDoneToday = tasks.filter(task => 
        task.completed && task.completedAt && isSameDay(new Date(task.completedAt), now)
    ).length;
    
    // Weekly Goal
    const weekFocusSeconds = timerSessions
        .filter(session => session.completedAt >= startOfWeek.getTime())
        .reduce((total, session) => total + session.duration, 0);
    const weekFocusMinutes = Math.floor(weekFocusSeconds / 60);
    const weeklyGoalPercent = Math.min(100, (weekFocusMinutes / WEEKLY_GOAL_MINUTES) * 100);

    // Streak
    const allActivityTimestamps = [
        ...tasks.filter(t => t.completedAt).map(t => t.completedAt!),
        ...timerSessions.map(s => s.completedAt)
    ];
    const uniqueActivityDays = [...new Set(allActivityTimestamps.map(ts => new Date(ts).setHours(0,0,0,0)))].sort((a,b) => b-a);
    
    let streak = 0;
    if (uniqueActivityDays.length > 0) {
        const todayTimestamp = today.getTime();
        if (uniqueActivityDays[0] === todayTimestamp) {
            streak = 1;
            for (let i = 0; i < uniqueActivityDays.length - 1; i++) {
                const day = uniqueActivityDays[i];
                const prevDay = uniqueActivityDays[i+1];
                if (day - prevDay === 24 * 60 * 60 * 1000) {
                    streak++;
                } else {
                    break;
                }
            }
        }
    }


    return { todayFocusMinutes, tasksDoneToday, streak, weeklyGoalPercent };
  }, [tasks, timerSessions]);

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Today's Focus</h3>
                <p className="text-3xl font-bold text-cyan-500 mt-1">{stats.todayFocusMinutes}<span className="text-lg ml-1">m</span></p>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Tasks Done</h3>
                <p className="text-3xl font-bold text-cyan-500 mt-1">{stats.tasksDoneToday}</p>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Streak</h3>
                <p className="text-3xl font-bold text-cyan-500 mt-1">{stats.streak} <span className="text-lg">days</span></p>
            </div>
            <div className="col-span-2 md:col-span-1">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Weekly Goal</h3>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${stats.weeklyGoalPercent}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1 text-right">{Math.round(stats.weeklyGoalPercent)}%</p>
            </div>
        </div>
    </div>
  );
};