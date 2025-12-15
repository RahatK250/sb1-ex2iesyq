import React, { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, AlertTriangle } from 'lucide-react';

interface Props {
  message: string;
  type?: 'success' | 'error' | 'warning';
  isVisible?: boolean;
  onClose: () => void;
}

export const Toast: React.FC<Props> = ({ message, type = 'success', isVisible = false, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          Icon: CheckCircle,
          iconColor: 'text-green-500',
          borderColor: 'border-green-200 dark:border-green-800',
          bgColor: 'bg-green-50 dark:bg-green-900/20'
        };
      case 'warning':
        return {
          Icon: AlertTriangle,
          iconColor: 'text-orange-500',
          borderColor: 'border-orange-200 dark:border-orange-800',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20'
        };
      case 'error':
      default:
        return {
          Icon: AlertCircle,
          iconColor: 'text-red-500',
          borderColor: 'border-red-200 dark:border-red-800',
          bgColor: 'bg-red-50 dark:bg-red-900/20'
        };
    }
  };

  const { Icon, iconColor, borderColor, bgColor } = getToastStyles();

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down max-w-md">
      <div className={`${bgColor} ${borderColor} border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-64 backdrop-blur-sm`}>
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        <span className="text-sm text-gray-800 dark:text-white flex-1">
          {message}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};