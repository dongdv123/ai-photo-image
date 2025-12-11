import { useState } from 'react';
import { getGeminiAPIInfo } from '../services/geminiService';

export function APIInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const info = getGeminiAPIInfo();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 text-sm z-40"
        title="Show API Information"
      >
        🔍 API Info
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-6 max-w-md z-50">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Gemini API Information</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="font-medium text-gray-700 mb-1">Provider:</p>
          <p className="text-gray-600">{info.provider}</p>
        </div>

        <div>
          <p className="font-medium text-gray-700 mb-1">SDK Package:</p>
          <p className="text-gray-600 font-mono">{info.package}@{info.sdkVersion}</p>
        </div>

        <div>
          <p className="font-medium text-gray-700 mb-1">API Endpoint:</p>
          <p className="text-gray-600 font-mono text-xs">{info.apiEndpoint}</p>
        </div>

        <div>
          <p className="font-medium text-gray-700 mb-1">API Key Status:</p>
          <p className={info.apiKeyConfigured ? 'text-green-600' : 'text-red-600'}>
            {info.apiKeyConfigured ? `✅ Configured (${info.apiKeyPrefix})` : '❌ Not configured'}
          </p>
        </div>

        <div>
          <p className="font-medium text-gray-700 mb-2">Available Models:</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Analysis Models:</p>
              <ul className="text-xs text-gray-500 space-y-1 ml-4">
                {info.availableModels.analysis.map((model, idx) => (
                  <li key={idx} className="list-disc">
                    <span className="font-mono">{model.name}</span> - {model.description} ({model.cost})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Image Models:</p>
              <ul className="text-xs text-gray-500 space-y-1 ml-4">
                {info.availableModels.image.map((model, idx) => (
                  <li key={idx} className="list-disc">
                    <span className="font-mono">{model.name}</span> - {model.description} ({model.cost})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <a
            href={info.documentation}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-700 text-xs underline"
          >
            📚 View Documentation →
          </a>
        </div>
      </div>
    </div>
  );
}

