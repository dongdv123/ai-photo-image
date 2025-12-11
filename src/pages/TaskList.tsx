import { useState, useMemo } from 'react';
import { useTaskStorage } from '../hooks/useTaskStorage';
import { Link } from 'react-router-dom';

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

export function TaskList() {
  const { tasks: allTasks, hasMore, isLoading, loadMore } = useTaskStorage('user-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Filter and sort tasks
  const tasks = useMemo(() => {
    let filtered = allTasks;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.productName.toLowerCase().includes(query) ||
          task.productDescription.toLowerCase().includes(query) ||
          task.vibe.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortOption) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.productName.localeCompare(a.productName));
        break;
    }

    return sorted;
  }, [allTasks, searchQuery, sortOption]);

  const pageHeight = 'calc(100vh - var(--header-height, 73px))';

  return (
    <div
      className="bg-white text-gray-900 overflow-hidden flex flex-col"
      style={{ height: pageHeight }}
    >
      <div className="flex-1 overflow-hidden">
        <div className="px-4 py-6 h-full">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg h-full flex flex-col">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-2xl font-semibold text-gray-900">Your Tasks</h2>
                <Link
                  to="/"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all"
                >
                  Create New Task
                </Link>
              </div>

              {/* Search and Sort */}
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, description, or vibe..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div className="sm:w-48">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              {searchQuery && (
                <div className="mt-3 text-sm text-gray-600">
                  Found {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'No tasks found matching your search.' : 'No tasks yet.'}
                  </p>
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-purple-600 hover:text-purple-700 underline"
                    >
                      Clear search
                    </button>
                  ) : (
                    <Link
                      to="/"
                      className="text-purple-600 hover:text-purple-700 underline"
                    >
                      Create your first task
                    </Link>
                  )}
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

              {hasMore && !searchQuery && (
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
      </div>
    </div>
  );
}

