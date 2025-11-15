export type Priority = 'A' | 'B' | 'C';

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  order: number;
  completedAt?: number;
  reminderAt?: number;
  reminderNotified?: boolean;
  tags?: string[];
}

export interface TimerSession {
  taskName: string;
  duration: number; // in seconds
  completedAt: number; // timestamp
}