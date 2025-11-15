import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { type Task, type Priority } from '../types';
import { Card } from './Card';
import { TodoItem } from './TodoItem';

const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const priorityConfig: Record<Priority, { base: string, active: string, label: string }> = {
    A: { base: 'border-slate-300 hover:bg-red-500/20', active: 'bg-red-500/20 border-red-500', label: 'High' },
    B: { base: 'border-slate-300 hover:bg-amber-500/20', active: 'bg-amber-500/20 border-amber-500', label: 'Medium' },
    C: { base: 'border-slate-300 hover:bg-cyan-500/20', active: 'bg-cyan-500/20 border-cyan-500', label: 'Low' },
};

const filterButtons: {label: string, value: 'All' | Priority}[] = [
    { label: 'All', value: 'All'},
    { label: 'High', value: 'A'},
    { label: 'Medium', value: 'B'},
    { label: 'Low', value: 'C'},
];

type SortBy = 'manual' | 'dueDate' | 'priority' | 'creationDate';
const sortButtons: {label: string, value: SortBy}[] = [
    { label: 'Manual', value: 'manual' },
    { label: 'Due Date', value: 'dueDate' },
    { label: 'Priority', value: 'priority' },
    { label: 'Created', value: 'creationDate' },
];


export const TodoList: React.FC = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
  const [newTaskText, setNewTaskText] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('B');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newTaskTags, setNewTaskTags] = useState('');
  const [filter, setFilter] = useState<'All' | Priority>('All');
  const [tagFilter, setTagFilter] = useState<'All' | string>('All');
  const [allTags, setAllTags] = useLocalStorage<string[]>('allTags', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('manual');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);
  
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const tasksToNotify = tasks.filter(task =>
        !task.completed &&
        task.reminderAt &&
        task.reminderAt <= now &&
        !task.reminderNotified
      );

      if (tasksToNotify.length > 0) {
        tasksToNotify.forEach(task => {
          new Notification('Task Reminder', {
            body: task.text,
            icon: '/vite.svg',
          });
        });

        setTasks(currentTasks =>
          currentTasks.map(task => {
            if (tasksToNotify.some(t => t.id === task.id)) {
              return { ...task, reminderNotified: true };
            }
            return task;
          })
        );
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [tasks, setTasks]);


  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim() === '') return;
    
    const tagsArray = newTaskTags.split(',').map(tag => tag.trim()).filter(Boolean);
    // FIX: Explicitly type uniqueTags as string[] to fix type inference issue on line 110.
    const uniqueTags: string[] = [...new Set(tagsArray)];

    let reminderTimestamp: number | undefined = undefined;
    if (newReminderDate && newReminderTime) {
      reminderTimestamp = new Date(`${newReminderDate}T${newReminderTime}`).getTime();
    }

    const newTask: Task = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false,
      priority: newPriority,
      order: Date.now(), // Use timestamp for default order
      reminderAt: reminderTimestamp,
      reminderNotified: false,
      tags: uniqueTags,
    };
    setTasks([...tasks, newTask]);

    if (uniqueTags.length > 0) {
        setAllTags([...new Set([...allTags, ...uniqueTags])].sort());
    }

    setNewTaskText('');
    setNewPriority('B');
    setNewReminderDate('');
    setNewReminderTime('');
    setNewTaskTags('');
  };

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map(task => {
        if (task.id === id) {
          const isCompleted = !task.completed;
          return { ...task, completed: isCompleted, completedAt: isCompleted ? Date.now() : undefined };
        }
        return task;
      })
    );
  };

  const deleteTask = (id: number) => {
    const taskToDelete = tasks.find(task => task.id === id);
    if (taskToDelete && window.confirm(`Are you sure you want to permanently delete this task?\n\n"${taskToDelete.text}"`)) {
      const updatedTasks = tasks.filter(task => task.id !== id);
      setTasks(updatedTasks);
      
      // Prune orphaned tags
      const remainingTags = new Set(updatedTasks.flatMap(t => t.tags || []));
      const updatedAllTags = allTags.filter(tag => remainingTags.has(tag));
      setAllTags(updatedAllTags);
    }
  };
  
  const updateTask = (id: number, updates: Partial<Task>) => {
    setTasks(tasks.map(task => {
        if (task.id === id) {
            const updatedTask = { ...task, ...updates };
            // If reminder is updated, reset notification status
            if ('reminderAt' in updates) {
                updatedTask.reminderNotified = false;
            }
            return updatedTask;
        }
        return task;
    }));

    // Update global tag list if tags were changed
    if (updates.tags) {
        const remainingTags = new Set(tasks.flatMap(t => t.id === id ? updates.tags : t.tags || []));
        const updatedAllTags = [...new Set([...allTags, ...updates.tags])].filter(tag => remainingTags.has(tag)).sort();
        setAllTags(updatedAllTags);
    }
  };

  const handleSort = () => {
    if (dragItemRef.current === null || dragOverItemRef.current === null || dragItemRef.current === dragOverItemRef.current) {
        return;
    }

    const tasksCopy = [...tasks];
    const dragItemIndex = tasksCopy.findIndex(t => t.id === dragItemRef.current);
    const dragOverItemIndex = tasksCopy.findIndex(t => t.id === dragOverItemRef.current);
    
    if (dragItemIndex === -1 || dragOverItemIndex === -1) return;

    // Reorder the array
    const [reorderedItem] = tasksCopy.splice(dragItemIndex, 1);
    tasksCopy.splice(dragOverItemIndex, 0, reorderedItem);

    // Update the 'order' property for all items to persist the new order
    const updatedTasks = tasksCopy.map((task, index) => ({
        ...task,
        order: index,
    }));

    setTasks(updatedTasks);
    setSortBy('manual'); // Switch back to manual sort after drag

    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  const completedCount = tasks.filter(task => task.completed).length;

  const filteredAndSortedTasks = useMemo(() => {
    let filteredTasks = [...tasks];

    // 1. Filter by priority
    if (filter !== 'All') {
        filteredTasks = filteredTasks.filter(task => task.priority === filter);
    }

    // 2. Filter by search query (text and tags)
    if (searchQuery.trim()) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
            task.text.toLowerCase().includes(lowercasedQuery) || 
            (task.tags && task.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery)))
        );
    }
    
    // 3. Filter by tag
    if (tagFilter !== 'All') {
        filteredTasks = filteredTasks.filter(task => task.tags?.includes(tagFilter));
    }

    // 4. Sort
    const sorted = filteredTasks.sort((a, b) => {
      // Incomplete tasks always come first
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      let comparison = 0;
      switch (sortBy) {
        case 'dueDate':
          if (!a.reminderAt && !b.reminderAt) comparison = 0;
          else if (!a.reminderAt) comparison = 1; // tasks without due date go to the end
          else if (!b.reminderAt) comparison = -1;
          else comparison = a.reminderAt - b.reminderAt;
          break;
        case 'priority':
          comparison = a.priority.localeCompare(b.priority); // A, B, C
          break;
        case 'creationDate':
          comparison = a.id - b.id; // oldest first
          break;
        case 'manual':
        default:
          const orderA = a.order ?? a.id;
          const orderB = b.order ?? b.id;
          comparison = orderA - orderB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [tasks, filter, searchQuery, tagFilter, sortBy, sortOrder]);
  
  const todayDateString = new Date().toISOString().split('T')[0];

  return (
    <Card title="To-Do List" icon={<ListIcon />}>
      <div className="flex flex-col h-full">
        <form onSubmit={addTask} className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
                 <input
                    type="text"
                    value={newTaskText}
                    onChange={e => setNewTaskText(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-grow bg-slate-100 border border-slate-300 rounded-md px-4 py-2 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                />
                 <div className="flex gap-2">
                    <input
                        type="date"
                        value={newReminderDate}
                        onChange={e => {
                            setNewReminderDate(e.target.value);
                            if (!newReminderTime) {
                                setNewReminderTime('09:00');
                            }
                        }}
                        title="Set a reminder date"
                        className="bg-slate-100 border border-slate-300 rounded-md px-3 py-2 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition w-full"
                        min={todayDateString}
                    />
                    <input
                        type="time"
                        value={newReminderTime}
                        onChange={e => setNewReminderTime(e.target.value)}
                        title="Set a reminder time"
                        className="bg-slate-100 border border-slate-300 rounded-md px-3 py-2 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition w-full"
                        disabled={!newReminderDate}
                    />
                 </div>
            </div>
            <input
                type="text"
                value={newTaskTags}
                onChange={e => setNewTaskTags(e.target.value)}
                placeholder="Tags (comma-separated)..."
                className="w-full bg-slate-100 border border-slate-300 rounded-md px-4 py-2 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
            />
          <div className="flex items-center gap-2">
            <div className="flex-grow flex items-center gap-2 text-sm">
                <span className="text-slate-500">Priority:</span>
                {(['A', 'B', 'C'] as Priority[]).map(p => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setNewPriority(p)}
                        className={`px-3 py-1 border rounded-md transition-colors ${newPriority === p ? priorityConfig[p].active : priorityConfig[p].base}`}
                    >
                        {priorityConfig[p].label}
                    </button>
                ))}
            </div>
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 shadow-md"
            >
              Add
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-4 mb-4 border-b border-t border-slate-200 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-auto sm:flex-grow max-w-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                      type="text"
                      placeholder="Search tasks & tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-200/50 border border-slate-300 rounded-md py-2 pl-10 pr-4 text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                  />
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Filter by Priority:</span>
                  {filterButtons.map(({label, value}) => (
                      <button 
                          key={value}
                          onClick={() => setFilter(value)}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === value ? 'bg-cyan-500 text-white font-semibold' : 'bg-slate-200 hover:bg-slate-300'}`}
                      >
                          {label}
                      </button>
                  ))}
              </div>
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">Filter by Tag:</span>
                <button 
                    onClick={() => setTagFilter('All')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${tagFilter === 'All' ? 'bg-cyan-500 text-white font-semibold' : 'bg-slate-200 hover:bg-slate-300'}`}
                >
                    All
                </button>
                {allTags.map((tag) => (
                    <button 
                        key={tag}
                        onClick={() => setTagFilter(tag)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${tagFilter === tag ? 'bg-cyan-500 text-white font-semibold' : 'bg-slate-200 hover:bg-slate-300'}`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Sort by:</span>
                  {sortButtons.map(({label, value}) => (
                      <button 
                          key={value}
                          onClick={() => setSortBy(value)}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${sortBy === value ? 'bg-cyan-500 text-white font-semibold' : 'bg-slate-200 hover:bg-slate-300'}`}
                      >
                          {label}
                      </button>
                  ))}
              </div>
               <button 
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-slate-200 hover:bg-slate-300"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                  <span>{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
                  {sortOrder === 'asc' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4V4" />
                      </svg>
                  )}
              </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            {filteredAndSortedTasks.length > 0 ? (
                <ul className="space-y-2">
                    {filteredAndSortedTasks.map(task => (
                    <TodoItem
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onUpdate={updateTask}
                        draggable={!task.completed && sortBy === 'manual'}
                        isDragging={draggingId === task.id}
                        onDragStart={(e) => {
                            dragItemRef.current = task.id;
                            setDraggingId(task.id);
                            e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnter={() => (dragOverItemRef.current = task.id)}
                        onDragEnd={() => {
                            handleSort();
                            setDraggingId(null);
                        }}
                    />
                    ))}
                </ul>
            ) : (
                <div className="text-center text-slate-500 pt-8">
                    <p>{tasks.length === 0 ? "No tasks yet. Add one to get started!" : "No tasks match your current filters."}</p>
                </div>
            )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-500">
            <p>
                {completedCount} of {tasks.length} tasks completed.
            </p>
        </div>
      </div>
    </Card>
  );
};