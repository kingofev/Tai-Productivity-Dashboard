
import React from 'react';

interface CardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, icon, children, className = '' }) => {
  return (
    <div className={`bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 h-full flex flex-col ${className}`}>
      <div className="flex items-center mb-4">
        {icon && <div className="mr-3 text-cyan-500">{icon}</div>}
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};