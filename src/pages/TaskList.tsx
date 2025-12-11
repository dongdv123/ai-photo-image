import { useTaskStorage } from '../hooks/useTaskStorage';
import { Link } from 'react-router-dom';

export function TaskList() {
  const { tasks, hasMore, isLoading, loadMore } = useTaskStorage('user-1');

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Your Tasks</h2>
            <Link
              to="/"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all"
            >
              Create New Task
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No tasks yet.</p>
              <Link
                to="/"
                className="text-purple-600 hover:text-purple-700 underline"
              >
                Create your first task
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/task/${task.id}`}
                  className="block bg-white hover:bg-gray-50 rounded-lg p-4 transition-colors border border-gray-200 hover:border-purple-500 shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {task.productName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {task.productDescription}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          <span className="font-medium">Vibe:</span> {task.vibe}
                        </span>
                        <span>
                          Created: {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          {task.generatedImages.length} image(s)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.generatedImages.length > 0 && (
                        <div className="flex gap-1">
                          {task.generatedImages.slice(0, 3).map((img, idx) => (
                            <div
                              key={idx}
                              className="w-12 h-12 rounded border border-gray-300 overflow-hidden"
                            >
                              <img
                                src={`data:${img.mimeType};base64,${img.data}`}
                                alt={`Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {task.generatedImages.length > 3 && (
                            <div className="w-12 h-12 rounded border border-gray-300 bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                              +{task.generatedImages.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

