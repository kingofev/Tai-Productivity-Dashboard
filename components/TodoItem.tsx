import React, { useState, useEffect } from 'react';
import { type Task, type Priority } from '../types';

interface TodoItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, updates: Partial<Task>) => void;
  draggable: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);
const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
const CancelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);


export const TodoItem: React.FC<TodoItemProps> = ({ task, onToggle, onDelete, onUpdate, draggable, isDragging, onDragStart, onDragEnter, onDragEnd }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('B');
  const [editReminderDate, setEditReminderDate] = useState('');
  const [editReminderTime, setEditReminderTime] = useState('');
  const [editTags, setEditTags] = useState('');

  const priorityConfig: Record<Priority, { color: string, label: string, base: string, active: string }> = {
    A: { color: 'bg-red-500', label: 'High Priority', base: 'border-slate-300 hover:bg-red-500/20', active: 'bg-red-500/20 border-red-500' },
    B: { color: 'bg-amber-500', label: 'Medium Priority', base: 'border-slate-300 hover:bg-amber-500/20', active: 'bg-amber-500/20 border-amber-500' },
    C: { color: 'bg-cyan-500', label: 'Low Priority', base: 'border-slate-300 hover:bg-cyan-500/20', active: 'bg-cyan-500/20 border-cyan-500' },
  };
  
  const handleStartEditing = () => {
    setEditText(task.text);
    setEditPriority(task.priority);
    setEditTags((task.tags || []).join(', '));
    if (task.reminderAt) {
      const reminder = new Date(task.reminderAt);
      // Format to YYYY-MM-DD
      setEditReminderDate(reminder.toISOString().split('T')[0]);
      // Format to HH:mm
      setEditReminderTime(reminder.toTimeString().slice(0, 5));
    } else {
      setEditReminderDate('');
      setEditReminderTime('');
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    const tagsArray = editTags.split(',').map(tag => tag.trim()).filter(Boolean);
    // FIX: Explicitly type uniqueTags as string[] to fix type inference issue.
    const uniqueTags: string[] = [...new Set(tagsArray)];

    let reminderTimestamp: number | undefined = undefined;
    if (editReminderDate && editReminderTime) {
      reminderTimestamp = new Date(`${editReminderDate}T${editReminderTime}`).getTime();
    }

    const updates: Partial<Task> = {
        text: editText.trim(),
        priority: editPriority,
        tags: uniqueTags,
        reminderAt: reminderTimestamp,
    };

    onUpdate(task.id, updates);
    setIsEditing(false);
  };

  const reminderDate = task.reminderAt ? new Date(task.reminderAt) : null;
  const formattedReminder = reminderDate?.toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
  });
  
  const isReminderPast = reminderDate && reminderDate.getTime() < Date.now();
  const todayDateString = new Date().toISOString().split('T')[0];

  if (isEditing) {
    return (
        <li className="flex flex-col items-start gap-3 bg-slate-200/80 p-3 rounded-lg">
            <input 
                type="text" 
                value={editText} 
                onChange={(e) => setEditText(e.target.value)} 
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" 
            />
            <input 
                type="text" 
                value={editTags} 
                onChange={(e) => setEditTags(e.target.value)} 
                placeholder="Tags (comma-separated)..."
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" 
            />
            <div className="flex w-full gap-2 items-center">
                 <div className="flex flex-grow gap-2">
                    <input
                        type="date"
                        value={editReminderDate}
                        onChange={e => {
                            setEditReminderDate(e.target.value);
                            if (!editReminderTime) {
                                setEditReminderTime('09:00');
                            }
                        }}
                        title="Set a reminder date"
                        className="bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition w-full"
                        min={todayDateString}
                    />
                    <input
                        type="time"
                        value={editReminderTime}
                        onChange={e => setEditReminderTime(e.target.value)}
                        title="Set a reminder time"
                        className="bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition w-full"
                        disabled={!editReminderDate}
                    />
                 </div>
                <button onClick={handleSave} className="text-slate-500 hover:text-green-500 transition-colors p-1" aria-label="Save changes"><SaveIcon /></button>
                <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-red-500 transition-colors p-1" aria-label="Cancel editing"><CancelIcon /></button>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Priority:</span>
                {(['A', 'B', 'C'] as Priority[]).map(p => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setEditPriority(p)}
                        className={`px-3 py-1 border rounded-md transition-colors ${editPriority === p ? priorityConfig[p].active : priorityConfig[p].base}`}
                    >
                        {priorityConfig[p].label}
                    </button>
                ))}
            </div>
        </li>
    );
  }
  
  const liClasses = [
    "flex items-start gap-3 p-3 rounded-lg transition-all duration-500 ease-in-out",
    task.completed
      ? "bg-slate-200/50 opacity-60"
      : "bg-white/50 hover:bg-white/80",
    draggable && !isEditing ? "cursor-grab" : "",
    isDragging ? "opacity-40" : ""
  ].filter(Boolean).join(" ");


  return (
    <li 
      className={liClasses}
      draggable={draggable && !isEditing}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
        <div className="flex-shrink-0 pt-1">
            <div 
                className={`w-1.5 h-6 rounded-full ${priorityConfig[task.priority].color}`}
                title={priorityConfig[task.priority].label}
            ></div>
        </div>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="form-checkbox h-5 w-5 rounded bg-slate-300 border-slate-400 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer flex-shrink-0 mt-1"
      />
      <div className="flex-grow flex flex-col">
        <span className={`${task.completed ? 'line-through text-slate-400' : 'text-slate-800'} transition-all duration-500 ease-in-out`}>
            {task.text}
        </span>
        <div className="flex flex-wrap items-center gap-2 mt-1">
            {reminderDate && !task.completed && (
                <div className={`flex items-center text-xs gap-1 ${isReminderPast ? 'text-amber-500' : 'text-cyan-600'}`}>
                    <BellIcon />
                    <span>{formattedReminder}</span>
                </div>
            )}
             {task.tags && task.tags.map(tag => (
                <span key={tag} className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
        </div>
      </div>
      <div className="flex flex-col items-center flex-shrink-0">
          <button
            onClick={handleStartEditing}
            className="text-slate-500 hover:text-cyan-500 transition-colors duration-200 p-1"
            aria-label={`Edit task: ${task.text}`}
          >
            <EditIcon />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-slate-500 hover:text-red-500 transition-colors duration-200 p-1"
            aria-label={`Delete task: ${task.text}`}
          >
            <DeleteIcon />
          </button>
      </div>
    </li>
  );
};