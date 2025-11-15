
import React, { useState, useEffect } from 'react';
import { Card } from './Card';

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const Clock: React.FC = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return (
    <Card title="Current Time" icon={<ClockIcon />}>
      <div className="text-center flex flex-col justify-center items-center h-full">
        <p className="text-5xl font-mono font-bold text-cyan-500">
          {date.toLocaleTimeString('en-US', timeOptions)}
        </p>
        <p className="text-lg text-slate-500 mt-2">
          {date.toLocaleDateString('en-US', dateOptions)}
        </p>
      </div>
    </Card>
  );
};