import { openDB, IDBPDatabase } from 'idb';
import { Task, Base64Image } from '../types';

const DB_NAME = 'aistudio_db';
const DB_VERSION = 1;
const STORE_TASKS = 'tasks';
const STORE_IMAGES = 'images';

let dbInstance: IDBPDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBPDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Tasks store
      if (!db.objectStoreNames.contains(STORE_TASKS)) {
        const taskStore = db.createObjectStore(STORE_TASKS, {
          keyPath: 'id'
        });
        taskStore.createIndex('userId', 'userId');
        taskStore.createIndex('createdAt', 'createdAt');
      }
      
      // Images store (separate để optimize)
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        const imageStore = db.createObjectStore(STORE_IMAGES, {
          keyPath: 'id'
        });
        imageStore.createIndex('taskId', 'taskId');
      }
    }
  });

  return dbInstance;
}

/**
 * Save task to IndexedDB
 */
export async function saveTask(task: Task): Promise<void> {
  const db = await initDB();
  
  // Save task metadata (without images)
  const taskMetadata = {
    ...task,
    generatedImages: [] // Remove images từ task
  };
  
  await db.put(STORE_TASKS, taskMetadata);
  
  // Save images riêng với reference
  for (let i = 0; i < task.generatedImages.length; i++) {
    await db.put(STORE_IMAGES, {
      id: `${task.id}-${i}`,
      taskId: task.id,
      imageIndex: i,
      data: task.generatedImages[i]
    });
  }
}

/**
 * Get task by ID
 */
export async function getTask(taskId: string): Promise<Task | undefined> {
  const db = await initDB();
  const taskMetadata = await db.get(STORE_TASKS, taskId);
  
  if (!taskMetadata) {
    return undefined;
  }
  
  // Load images
  const images = await loadTaskImages(taskId);
  
  return {
    ...taskMetadata,
    generatedImages: images
  } as Task;
}

/**
 * Load images for a task
 */
async function loadTaskImages(taskId: string): Promise<Base64Image[]> {
  const db = await initDB();
  
  // Get all images for this task
  const allImages = await db.getAllFromIndex(STORE_IMAGES, 'taskId', taskId);
  
  // Sort theo imageIndex
  allImages.sort((a, b) => a.imageIndex - b.imageIndex);
  
  return allImages.map(entry => entry.data);
}

/**
 * Load tasks với pagination
 */
export async function loadTasksLazy(
  userId: string,
  page: number,
  pageSize: number = 5
): Promise<{ tasks: Task[]; hasMore: boolean }> {
  const db = await initDB();
  
  // Get all tasks for user
  const allTasks = await db.getAllFromIndex(STORE_TASKS, 'userId', userId);
  
  // Sort by createdAt descending
  allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Paginate
  const start = page * pageSize;
  const end = start + pageSize;
  const paginatedTasks = allTasks.slice(start, end);
  
  // Load images for each task
  const tasks: Task[] = await Promise.all(
    paginatedTasks.map(async (taskMetadata) => {
      const images = await loadTaskImages(taskMetadata.id);
      return {
        ...taskMetadata,
        generatedImages: images
      } as Task;
    })
  );
  
  const hasMore = end < allTasks.length;
  
  return { tasks, hasMore };
}

/**
 * Delete task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const db = await initDB();
  
  // Delete images
  const images = await db.getAllFromIndex(STORE_IMAGES, 'taskId', taskId);
  await Promise.all(images.map(img => db.delete(STORE_IMAGES, img.id)));
  
  // Delete task
  await db.delete(STORE_TASKS, taskId);
}

/**
 * Cleanup old tasks
 */
export async function cleanupOldTasks(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
  const db = await initDB();
  
  const cutoffDate = new Date(Date.now() - maxAge); // 30 days ago
  
  // Get all tasks
  const allTasks = await db.getAll(STORE_TASKS);
  
  // Filter old tasks
  const oldTasks = allTasks.filter(task => new Date(task.createdAt) < cutoffDate);
  
  // Delete old tasks
  await Promise.all(oldTasks.map(task => deleteTask(task.id)));
}

