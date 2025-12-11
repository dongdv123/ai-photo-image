import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Task, Base64Image } from '../types';
import { getTask, deleteTask as deleteTaskFromDB, updateTask } from '../services/storageService';
import { ImageViewer } from '../components/ImageViewer';
import { downloadImage, downloadAllImages } from '../utils/imageUtils';
import { useImageGeneration } from '../hooks/useImageGeneration';

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const { modelType, qualityMode } = useImageGeneration();

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

  const handleDownloadImage = (e: React.MouseEvent, image: Base64Image, index: number) => {
    e.stopPropagation();
    try {
      downloadImage(image, `${task?.productName || 'image'}-${index + 1}.png`);
    } catch (error) {
      alert('Failed to download image');
    }
  };

  const handleDownloadAll = () => {
    if (!task || task.generatedImages.length === 0) return;
    try {
      downloadAllImages(task.generatedImages, task.productName || 'images');
    } catch (error) {
      alert('Failed to download images');
    }
  };

  const handleRegenerateImage = async (index: number) => {
    if (!task || !task.analysis || !id) return;
    
    setRegeneratingIndex(index);
    try {
      // Get the original reference images
      const referenceImages: Base64Image[] = task.inputImages || [];
      
      // Generate single image using the same plan
      const { createImageGenerationPlan, constructPromptsFromPlan, generateProductImage } = await import('../services/geminiService');
      const plan = createImageGenerationPlan(task.generatedImages.length);
      const prompts = constructPromptsFromPlan(
        plan,
        task.analysis,
        task.vibe,
        task.productName,
        task.productDescription,
        referenceImages.length,
        qualityMode
      );
      
      // Use the prompt from the same index position
      const promptIndex = Math.min(index, prompts.length - 1);
      const { retryWithSmartBackoff } = await import('../utils/retry');
      
      const newImage = await retryWithSmartBackoff(
        () => generateProductImage(prompts[promptIndex], referenceImages, modelType),
        3
      );

      // Update task with new image
      const updatedImages = [...task.generatedImages];
      updatedImages[index] = newImage;
      
      const updatedTask: Task = {
        ...task,
        generatedImages: updatedImages
      };
      
      await updateTask(updatedTask);
      setTask(updatedTask);
    } catch (error: any) {
      console.error('Failed to regenerate image:', error);
      alert(error.message || 'Failed to regenerate image');
    } finally {
      setRegeneratingIndex(null);
    }
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

  const pageHeight = 'calc(100vh - var(--header-height, 73px))';

  return (
    <>
      <div
        className="bg-white text-gray-900 overflow-hidden flex flex-col"
        style={{ height: pageHeight }}
      >
        <div className="flex-1 overflow-y-auto">
          <div className=" px-4 py-6">
            {/* Back Button + Actions */}
            <div className="mb-6 sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-gray-200 py-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/tasks"
                  className="inline-flex items-center text-purple-600 hover:text-purple-700"
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadAll}
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all"
                  >
                    Download All
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Task
                  </button>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3">{task.productName}</h1>
              <p className="text-gray-600 mt-1">{task.productDescription}</p>
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Generated Images</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {task.generatedImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-300 group bg-white shadow-md hover:shadow-lg"
                      >
                        <img
                          src={`data:${img.mimeType};base64,${img.data}`}
                          alt={`Generated ${idx + 1}`}
                          onClick={() => handleImageClick(idx)}
                          className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                        />
                        {/* Action Buttons Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => handleDownloadImage(e, img, idx)}
                            className="opacity-0 group-hover:opacity-100 bg-white rounded-full p-2 hover:bg-gray-100 transition-all"
                            title="Download"
                          >
                            <svg
                              className="w-5 h-5 text-gray-800"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageClick(idx);
                            }}
                            className="opacity-0 group-hover:opacity-100 bg-white rounded-full p-2 hover:bg-gray-100 transition-all"
                            title="View"
                          >
                            <svg
                              className="w-5 h-5 text-gray-800"
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
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerateImage(idx);
                            }}
                            disabled={regeneratingIndex === idx}
                            className="opacity-0 group-hover:opacity-100 bg-white rounded-full p-2 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Regenerate"
                          >
                            {regeneratingIndex === idx ? (
                              <svg
                                className="w-5 h-5 text-gray-800 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5 text-gray-800"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

