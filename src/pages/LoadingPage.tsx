import React from 'react';
import { Zap } from 'lucide-react';

export const LoadingPage: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <img
            src="https://cdn-icons-png.flaticon.com/512/11569/11569487.png"
            alt="Qollect Logo"
            className="w-full h-full"
          />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-600"></div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Qollect
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          Completing sign-in...
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
          <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
          <p className="text-sm">Please wait</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
