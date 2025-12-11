import { useState, useEffect } from 'react';
import { Task } from '../types';
import { saveTask, loadTasksLazy, getTask, deleteTask as deleteTaskFromDB } from '../services/storageService';

export function useTaskStorage(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 5;

  useEffect(() => {
    loadTasks();
  }, [userId, currentPage]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const result = await loadTasksLazy(userId, currentPage - 1, pageSize);
      if (currentPage === 1) {
        setTasks(result.tasks);
      } else {
        setTasks(prev => [...prev, ...result.tasks]);
      }
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (task: Task) => {
    try {
      await saveTask(task);
      // Reload first page
      setCurrentPage(1);
      await loadTasks();
    } catch (error) {
      console.error('Failed to save task:', error);
      throw error;
    }
  };

  const loadTask = async (taskId: string) => {
    try {
      const task = await getTask(taskId);
      return task;
    } catch (error) {
      console.error('Failed to load task:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteTaskFromDB(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const refresh = () => {
    setCurrentPage(1);
    setHasMore(true);
    loadTasks();
  };

  return {
    tasks,
    currentPage,
    hasMore,
    isLoading,
    addTask,
    loadTask,
    deleteTask,
    loadMore,
    refresh,
  };
}

