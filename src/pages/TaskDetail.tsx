import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Task } from '../types';
import { getTask, deleteTask as deleteTaskFromDB } from '../services/storageService';
import { ImageViewer } from '../components/ImageViewer';

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const taskData = await getTask(id);
      if (taskData) {
        setTask(taskData);
      } else {
        // Task not found, redirect to list
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Failed to load task:', error);
      navigate('/tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !task) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTaskFromDB(id);
        navigate('/tasks');
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task');
      }
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Task not found</p>
          <Link
            to="/tasks"
            className="text-purple-600 hover:text-purple-700 underline"
          >
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white text-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              to="/tasks"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Tasks
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">{task.productName}</h1>
            <p className="text-gray-600 mt-2">{task.productDescription}</p>
          </div>

          {/* Main Content */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Task Details</h2>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-gray-700">Vibe:</span>{' '}
                    <span className="text-gray-600">{task.vibe}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Created:</span>{' '}
                    <span className="text-gray-600">
                      {new Date(task.createdAt).toLocaleString()}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Generated Images:</span>{' '}
                    <span className="text-gray-600">{task.generatedImages.length}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Task
              </button>
            </div>

            {/* Analysis Section */}
            {task.analysis && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Product Analysis</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Geometric Sketch:</span>
                    <p className="text-gray-600 mt-1">{task.analysis.analysis.sketch}</p>
                  </div>
                  {Object.keys(task.analysis.analysis.dimensions).length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Dimensions:</span>
                      <ul className="mt-1 space-y-1 text-gray-600">
                        {Object.entries(task.analysis.analysis.dimensions).map(([key, dim]) => (
                          <li key={key}>
                            {dim.label}: {dim.description} ({dim.estimate})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Materials:</span>
                    <p className="text-gray-600 mt-1">
                      {task.analysis.analysis.materials.primary}
                      {task.analysis.analysis.materials.secondary && 
                        `, ${task.analysis.analysis.materials.secondary}`}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {task.analysis.analysis.materials.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Section */}
            {task.analysis && task.analysis.seo.titles.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-3">SEO Content</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Titles:</span>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      {task.analysis.seo.titles.map((title, idx) => (
                        <li key={idx}>{title}</li>
                      ))}
                    </ul>
                  </div>
                  {task.analysis.seo.tags.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Tags:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {task.analysis.seo.tags[0].map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white rounded text-gray-700 text-xs border border-purple-200 shadow-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Generated Images */}
            {task.generatedImages.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Generated Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {task.generatedImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleImageClick(idx)}
                      className="relative aspect-square rounded-lg overflow-hidden border border-gray-300 cursor-pointer hover:border-purple-500 transition-all group bg-white shadow-md hover:shadow-lg"
                    >
                      <img
                        src={`data:${img.mimeType};base64,${img.data}`}
                        alt={`Generated ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewerOpen && task.generatedImages.length > 0 && (
        <ImageViewer
          images={task.generatedImages}
          currentIndex={selectedImageIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

