import { create } from 'zustand';
import { Task } from '../types';

interface AppState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  addTask: (task: Task) => void;
  setCurrentTask: (task: Task | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTasks: () => void;
}

export const useStore = create<AppState>((set) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  setCurrentTask: (task) => set({ currentTask: task }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearTasks: () => set({ tasks: [] }),
}));

