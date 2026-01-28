import React from 'react';
import { Zap } from 'lucide-react';

interface Props {
  isVisible: boolean;
  message?: string;
}

export const AuthLoadingOverlay: React.FC<Props> = ({ 
  isVisible, 
  message = 'Signing in with Office 365...' 
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative w-16 h-16">
            <img
              src="https://cdn-icons-png.flaticon.com/512/11569/11569487.png"
              alt="Qollect Logo"
              className="w-full h-full"
            />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-600"></div>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Qollect
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {message}
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
          <Zap className="w-4 h-4 text-yellow-500" />
          <p className="text-xs">One moment...</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLoadingOverlay;
