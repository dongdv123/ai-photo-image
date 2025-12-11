import { useRef, useEffect, useState } from 'react';
import { useImageUpload } from '../hooks/useImageUpload';
import { Base64Image } from '../types';

interface ImageUploadProps {
  onImagesUploaded: (images: Base64Image[]) => void;
}

export function ImageUpload({ onImagesUploaded }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { images, isUploading, uploadProgress, error, uploadImages, clearImages, removeImage, reorderImages } = useImageUpload();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    onImagesUploaded(images);
  }, [images]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderImages(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      await uploadImages(files, images.length > 0);
    } catch (err) {
      // Error already handled in hook
    }
    // Reset input to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors bg-gray-50">
        {images.length === 0 ? (
          <div>
            <button
              onClick={handleClick}
              disabled={isUploading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? 'Uploading...' : 'Upload Images (1-3 images)'}
            </button>
            {isUploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">{Math.round(uploadProgress)}%</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-green-600 flex items-center gap-2 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {images.length} image(s) uploaded
              </p>
              <button
                onClick={handleClick}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs"
              >
                Add More
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-move ${
                    draggedIndex === idx
                      ? 'border-purple-500 opacity-50 scale-95'
                      : dragOverIndex === idx
                      ? 'border-purple-500 scale-105'
                      : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  <img
                    src={`data:${img.mimeType};base64,${img.data}`}
                    alt={`Uploaded ${idx + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-xs font-medium rounded">
                    {idx + 1}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(idx);
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                    title="Remove image"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center">
                    <div className="px-2 py-1 bg-black/50 text-white text-xs rounded flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                      Drag to reorder
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={clearImages}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Clear All
            </button>
          </div>
        )}
        
        {error && (
          <p className="mt-4 text-red-600 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}

