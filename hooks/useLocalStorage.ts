import React, { useState, useEffect } from 'react';
import { Task } from '../types';

export const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      let parsedItem = JSON.parse(item);

      // Data migration logic for tasks to prevent crashes with old data structures
      if (key === 'tasks' && Array.isArray(parsedItem)) {
        parsedItem = parsedItem.map((task: any) => {
          // Basic validation to skip non-objects from very old versions
          if (typeof task !== 'object' || task === null) return null;

          const migratedTask: Task = {
            id: task.id || Date.now(),
            text: task.text || 'Untitled Task',
            completed: typeof task.completed === 'boolean' ? task.completed : false,
            priority: ['A', 'B', 'C'].includes(task.priority) ? task.priority : 'B',
            order: typeof task.order === 'number' ? task.order : task.id || Date.now(),
            tags: Array.isArray(task.tags) ? task.tags : [],
            ...(task.completedAt && { completedAt: task.completedAt }),
            ...(task.reminderAt && { reminderAt: task.reminderAt }),
            ...(task.reminderNotified && { reminderNotified: task.reminderNotified }),
          };
          return migratedTask;
        }).filter(Boolean); // Filter out any null/invalid tasks
      }

      return parsedItem;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};