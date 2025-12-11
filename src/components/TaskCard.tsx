import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Task } from '../types';
import { ImageViewer } from './ImageViewer';

interface TaskCardProps {
  task: Task;
  onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, onDelete }: TaskCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedImageIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <Link
        to={`/task/${task.id}`}
        className="block bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-blue-500 transition-all"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-800">{task.productName}</h3>
            <p className="text-sm text-gray-500 mt-1">{task.productDescription}</p>
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Vibe:</span> {task.vibe}
          </p>
          <p className="text-xs text-gray-500">
            Created: {new Date(task.createdAt).toLocaleDateString()}
          </p>
        </div>

        {task.generatedImages.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {task.generatedImages.map((img, idx) => (
              <div
                key={idx}
                onClick={(e) => handleImageClick(e, idx)}
                className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-blue-500 transition-all group"
              >
                <img
                  src={`data:${img.mimeType};base64,${img.data}`}
                  alt={`Generated ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
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
        )}

        {task.analysis && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <span className="font-medium">Sketch:</span> {task.analysis.analysis.sketch.substring(0, 100)}...
            </p>
          </div>
        )}
      </Link>

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

