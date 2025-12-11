import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { CreateTask } from './pages/CreateTask';
import { TaskList } from './pages/TaskList';
import { TaskDetail } from './pages/TaskDetail';
import { analysisCache } from './utils/cache';
import { logAPIConfiguration } from './services/geminiService';

function App() {
  // Load cache on mount
  useEffect(() => {
    analysisCache.loadFromLocalStorage();
    // Log API configuration on startup
    logAPIConfiguration();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 min-h-0">
          <Routes>
            <Route path="/" element={<CreateTask />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;

