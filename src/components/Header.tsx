import { useNavigate, useLocation } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="border-b border-gray-200 bg-white w-full px-6 py-4 shadow-sm sticky top-0 z-50">
      <div className="flex justify-between items-center w-full">
        <button
          onClick={() => navigate('/')}
          className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent hover:from-purple-400 hover:to-purple-500 transition-all"
        >
          AIstudio
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tasks')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
              location.pathname === '/tasks'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            View Tasks
          </button>
          {location.pathname !== '/' && (
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-all text-sm"
            >
              Create New
            </button>
          )}
          <div className="px-3 py-1 bg-green-100 border border-green-300 rounded-full text-xs text-green-700">
            Ready
          </div>
        </div>
      </div>
    </header>
  );
}

