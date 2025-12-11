import { useState } from 'react';
import { Base64Image } from '../types';
import { optimizeImage, validateImage, fileToBase64 } from '../utils/imageCompression';

export function useImageUpload() {
  const [images, setImages] = useState<Base64Image[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImages = async (files: FileList, append: boolean = false) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const fileArray = Array.from(files);
      const currentCount = images.length;
      const newFilesCount = fileArray.length;
      
      if (currentCount + newFilesCount > 3) {
        throw new Error('Maximum 3 images allowed. Please remove some images first.');
      }

      const results: Base64Image[] = append ? [...images] : [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];

        // Validate
        const validation = validateImage(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Optimize
        const optimizedFile = await optimizeImage(file);

        // Convert to Base64
        const base64 = await fileToBase64(optimizedFile);
        results.push(base64);

        // Update progress
        setUploadProgress(((i + 1) / fileArray.length) * 100);
      }

      setImages(results);
      return results;
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const clearImages = () => {
    setImages([]);
    setUploadProgress(0);
    setError(null);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const newImages = [...prev];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      return newImages;
    });
  };

  const setImagesDirectly = (newImages: Base64Image[]) => {
    setImages(newImages);
  };

  return {
    images,
    isUploading,
    uploadProgress,
    error,
    uploadImages,
    clearImages,
    removeImage,
    reorderImages,
    setImagesDirectly,
  };
}

