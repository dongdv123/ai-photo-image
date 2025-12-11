import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageUpload } from '../components/ImageUpload';
import { ProgressBar } from '../components/ProgressBar';
import { APIInfo } from '../components/APIInfo';
import { ImageViewer } from '../components/ImageViewer';
import { useImageGeneration } from '../hooks/useImageGeneration';
import { useTaskStorage } from '../hooks/useTaskStorage';
import { useStore } from '../store/useStore';
import { Base64Image, Task } from '../types';
import { compressImageForStorage } from '../utils/imageCompression';

export function CreateTask() {
  const navigate = useNavigate();
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [vibe, setVibe] = useState('');
  const [uploadedImages, setUploadedImages] = useState<Base64Image[]>([]);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const { isAnalyzing, isGenerating, generatedImages, generationProgress, error, modelType, setModelType, imageCount, setImageCount, useParallel, setUseParallel, analyzeProduct, generateImages, reset } = useImageGeneration();
  const { addTask } = useTaskStorage('user-1');
  const { setLoading, setError } = useStore();

  const handleImagesUploaded = (images: Base64Image[]) => {
    setUploadedImages(images);
  };

  const handleProcess = async () => {
    if (!productName || !productDescription || uploadedImages.length === 0) {
      alert('Please fill in all fields and upload images');
      return;
    }

    // Validate image count
    if (imageCount < 1 || imageCount > 6) {
      alert('Image count must be between 1 and 6');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Clear preview when starting new process
      reset();
      setCreatedTaskId(null);

      console.log('🚀 Starting image generation process...');
      console.log(`📋 Product: ${productName}`);
      console.log(`📝 Description: ${productDescription.substring(0, 50)}...`);
      console.log(`🎨 Model: ${modelType}, Images: ${imageCount}, Parallel: ${useParallel}`);

      // Step 1: Analyze product
      console.log('📊 Step 1: Analyzing product...');
      const analysisResult = await analyzeProduct(
        uploadedImages,
        productName,
        productDescription,
        modelType,
        modelType === 'auto' // Use cache only for auto mode
      );
      console.log('✅ Analysis completed:', analysisResult);

      // Step 2: Generate images
      console.log(`🖼️ Step 2: Generating ${imageCount} images...`);
      const generated = await generateImages(
        uploadedImages,
        analysisResult,
        productName,
        productDescription,
        vibe || 'professional',
        imageCount,
        useParallel
      );
      console.log(`✅ Generated ${generated.length} images`);

      // Validate generated images
      if (!generated || generated.length === 0) {
        throw new Error('No images were generated. Please try again.');
      }

      // Step 3: Compress images for storage
      console.log('💾 Step 3: Compressing images for storage...');
      const compressedImages = await Promise.all(
        generated.map((img, idx) => {
          console.log(`Compressing image ${idx + 1}/${generated.length}`);
          return compressImageForStorage(img, 0.7);
        })
      );
      console.log('✅ Images compressed');

      // Step 4: Create task
      console.log('📝 Step 4: Creating task...');
      const task: Task = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: 'user-1',
        productName,
        productDescription,
        inputImages: uploadedImages,
        analysis: analysisResult,
        generatedImages: compressedImages,
        createdAt: new Date(),
        vibe: vibe || 'professional'
      };

      // Step 5: Save task
      console.log('💾 Step 5: Saving task to storage...');
      await addTask(task);
      console.log(`✅ Task saved with ID: ${task.id}`);

      // Store task ID for navigation
      setCreatedTaskId(task.id);

      console.log('🎉 Image generation process completed successfully!');
      
      // Clear input fields after successful generation
      setProductName('');
      setProductDescription('');
      setVibe('');
      setUploadedImages([]);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process images';
      console.error('❌ Error during image generation:', err);
      setError(errorMessage);
      alert(`Error: ${errorMessage}\n\nPlease check:\n- API key is configured\n- Internet connection\n- Try again with fewer images`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-gray-900 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 73px)' }}>
      {/* Main Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Controls */}
        <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* Top Buttons */}
          <div className="p-4 border-b border-gray-200 bg-white flex gap-3">
            <button
              onClick={handleProcess}
              disabled={isAnalyzing || isGenerating || !productName || !productDescription || uploadedImages.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Generate
            </button>
           
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="Enter product name"
                />
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  Describe your product *
                </label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400 min-h-[120px] resize-none"
                  placeholder="A futuristic product with sleek design, premium materials, and modern aesthetics..."
                  rows={4}
                />
              </div>

              {/* Vibe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vibe (Optional)
                </label>
                <input
                  type="text"
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="e.g., professional, cozy, luxury, modern"
                />
              </div>

              {/* Upload Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images (1-3 images) *
                </label>
                <div className="bg-white border border-gray-300 rounded-lg p-4">
                  <ImageUpload onImagesUploaded={handleImagesUploaded} />
                </div>
              </div>

              {/* AI Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model
                </label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value as 'auto' | 'flash' | 'pro')}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                >
                  <option value="auto">🚀 Auto (Recommended)</option>
                  <option value="flash">⚡ Flash - Fast & Cheap</option>
                  <option value="pro">💎 Pro - Higher Quality</option>
                </select>
                {/* Model Description */}
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
                  {modelType === 'auto' && (
                    <div>
                      <p className="font-medium text-gray-700 mb-1">🚀 Chế độ Tự động:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Phân tích: Sử dụng <strong>Gemini 2.5 Flash</strong> (nhanh, tiết kiệm)</li>
                        <li>Tạo ảnh: Sử dụng <strong>Gemini 2.5 Flash Image</strong></li>
                        <li>✅ Cân bằng tốt giữa tốc độ và chi phí</li>
                        <li>✅ Kết quả phân tích được cache để tiết kiệm API calls</li>
                        <li>💡 Khuyến nghị cho hầu hết người dùng</li>
                      </ul>
                    </div>
                  )}
                  {modelType === 'flash' && (
                    <div>
                      <p className="font-medium text-gray-700 mb-1">⚡ Chế độ Flash:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Phân tích: Sử dụng <strong>Gemini 2.5 Flash</strong></li>
                        <li>Tạo ảnh: Sử dụng <strong>Gemini 2.5 Flash Image</strong></li>
                        <li>⚡ Tốc độ xử lý nhanh nhất</li>
                        <li>💰 Chi phí thấp nhất mỗi request</li>
                        <li>✅ Chất lượng tốt cho hầu hết trường hợp</li>
                        <li>💡 Tốt nhất cho người dùng tạo nhiều hoặc tiết kiệm chi phí</li>
                      </ul>
                    </div>
                  )}
                  {modelType === 'pro' && (
                    <div>
                      <p className="font-medium text-gray-700 mb-1">💎 Chế độ Pro:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Phân tích: Sử dụng <strong>Gemini 2.5 Pro</strong> (phân tích chất lượng cao hơn)</li>
                        <li>Tạo ảnh: Sử dụng <strong>Gemini 2.5 Flash Image</strong> (model tạo ảnh chỉ hỗ trợ Flash)</li>
                        <li>🎯 Phân tích chất lượng cao với hiểu biết tốt hơn</li>
                        <li>💰 Chi phí cao hơn cho giai đoạn phân tích</li>
                        <li>⏱️ Chậm hơn một chút so với Flash</li>
                        <li>💡 Tốt nhất cho sản phẩm phức tạp cần phân tích chi tiết</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Images
                </label>
                <select
                  value={imageCount}
                  onChange={(e) => setImageCount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                >
                  <option value={1}>1 image</option>
                  <option value={2}>2 images</option>
                  <option value={3}>3 images</option>
                  <option value={4}>4 images (Recommended)</option>
                  <option value={5}>5 images</option>
                  <option value={6}>6 images</option>
                </select>
              </div>

              {/* Parallel Generation Toggle */}
              {imageCount > 2 && (
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-lg">
                  <input
                    type="checkbox"
                    id="parallel-generation"
                    checked={useParallel}
                    onChange={(e) => setUseParallel(e.target.checked)}
                    className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="parallel-generation" className="flex-1 text-sm text-gray-700 cursor-pointer">
                    Parallel Generation
                    <span className="ml-2 text-xs text-gray-500">
                      - Faster for {imageCount} images (~{Math.round((1 - (1 / imageCount)) * 100)}% time saved)
                    </span>
                  </label>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleProcess}
                disabled={isAnalyzing || isGenerating || !productName || !productDescription || uploadedImages.length === 0}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate Image
              </button>

              {/* Usage Info */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Powered by AIstudio</span>
                </div>
                <span>Free generations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Preview Header */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
          </div>

          {/* Preview Content */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            {/* Progress/Status Section */}
            {(isAnalyzing || isGenerating) && (
              <div className="flex-shrink-0 mb-4 space-y-3">
                {isAnalyzing && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      <div className="flex-1">
                        <p className="text-purple-900 font-medium">Analyzing product...</p>
                        <p className="text-purple-700 text-xs mt-1">Extracting product details and generating SEO content</p>
                      </div>
                    </div>
                  </div>
                )}
                {isGenerating && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                        <div className="flex-1">
                          <p className="text-purple-900 font-medium">Generating images...</p>
                          <p className="text-purple-700 text-xs mt-1">Creating professional product photos with AI</p>
                        </div>
                      </div>
                      <ProgressBar
                        current={generationProgress.current}
                        total={generationProgress.total}
                        label={`Progress: ${generationProgress.current} of ${generationProgress.total} images`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error in Preview */}
            {error && (
              <div className="flex-shrink-0 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 font-medium text-sm">{error}</p>
                </div>
              </div>
            )}

            {generatedImages.length > 0 ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Success Message */}
                <div className="flex-shrink-0 mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-green-800 font-medium text-sm">Images generated successfully!</p>
                      <p className="text-green-700 text-xs mt-0.5">{generatedImages.length} image(s) created</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {createdTaskId && (
                  <div className="flex-shrink-0 mb-3 flex gap-2">
                    <button
                      onClick={() => navigate(`/task/${createdTaskId}`)}
                      className="flex-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Task Detail
                    </button>
                    <button
                      onClick={() => {
                        setProductName('');
                        setProductDescription('');
                        setVibe('');
                        setUploadedImages([]);
                        setCreatedTaskId(null);
                        reset();
                      }}
                      className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-gray-700 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create New
                    </button>
                  </div>
                )}

                {/* Images Grid */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="grid grid-cols-4 gap-2">
                    {generatedImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedImageIndex(idx);
                          setViewerOpen(true);
                        }}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-300 bg-white hover:border-purple-500 transition-all group cursor-pointer shadow-sm hover:shadow-md"
                      >
                        <img
                          src={`data:${img.mimeType};base64,${img.data}`}
                          alt={`Generated ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm rounded text-xs text-gray-700 font-medium shadow-sm">
                          {idx + 1}
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
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
              </div>
            ) : !isAnalyzing && !isGenerating ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center border-2 border-purple-200 shadow-md">
                    <svg className="w-16 h-16 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Your generated images will appear here</h3>
                  <p className="text-gray-600 text-sm">Enter product details and click Generate</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* API Info Component */}
      <APIInfo />

      {/* Image Viewer Modal */}
      {viewerOpen && generatedImages.length > 0 && (
        <ImageViewer
          images={generatedImages}
          currentIndex={selectedImageIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
