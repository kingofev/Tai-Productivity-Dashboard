
import React from 'react';
import { Clock } from './components/Clock';
import { Timer } from './components/Timer';
import { TodoList } from './components/TodoList';
import { DashboardSummary } from './components/DashboardSummary';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Task, TimerSession } from './types';
import { MotivationalQuote } from './components/MotivationalQuote';

const App: React.FC = () => {
  const [tasks] = useLocalStorage<Task[]>('tasks', []);
  const [timerSessions] = useLocalStorage<TimerSession[]>('timerSessions', []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
          Zenith Productivity Dashboard
        </h1>
        <p className="text-slate-500 mt-2">Your personal space to focus and achieve.</p>
      </header>

      <div className="mb-6">
        <MotivationalQuote />
      </div>

      <div className="mb-8">
        <DashboardSummary tasks={tasks} timerSessions={timerSessions} />
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
          <Clock />
          <Timer />
        </div>
        <div className="lg:col-span-2">
          <TodoList />
        </div>
      </main>
      
      <footer className="text-center mt-12 text-slate-500 text-sm">
        <p>Built with React & Tailwind CSS.</p>
      </footer>
    </div>
  );
};

export default App;