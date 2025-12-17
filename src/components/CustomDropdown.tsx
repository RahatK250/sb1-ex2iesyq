import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface Props {
  options: Option[];
  selectedValue: string | 'all';
  onValueChange: (value: string | 'all') => void;
  placeholder?: string;
  allText?: string;
  className?: string;
  disabled?: boolean;
  // Optional extra action shown inside the dropdown (e.g. "+ Add Module").
  // If `showWhenEmpty` is true, the action is only shown when `options.length === 0`.
  extraActionLabel?: string;
  onExtraAction?: () => void;
  showExtraWhenEmpty?: boolean;
}

export const CustomDropdown: React.FC<Props> = ({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select option',
  allText = 'All',
  className = '',
  disabled = false,
  extraActionLabel,
  onExtraAction,
  showExtraWhenEmpty = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionSelect = (value: string | 'all') => {
    onValueChange(value);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (selectedValue === 'all') return allText;
    const selectedOption = options.find(option => option.id === selectedValue);
    return selectedOption?.name || placeholder;
  };

  // Only show "All" option if allText is different from placeholder
  const showAllOption = allText !== placeholder;
  const allOptions = showAllOption ? [{ id: 'all', name: allText }, ...options] : options;

  return (
    <div className={`relative ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={dropdownRef}>
      {/* Selected Option Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="select-enhanced w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Options */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto scrollbar-hide">
          {allOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionSelect(showAllOption && option.id === 'all' ? 'all' : option.id)}
              className="dropdown-option w-full px-4 py-3 text-left hover:bg-white/5 dark:hover:bg-white/10 flex items-center justify-between group"
            >
              <span className="text-gray-800 dark:text-white truncate">
                {option.name}
              </span>
              {selectedValue === (showAllOption && option.id === 'all' ? 'all' : option.id) && (
                <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
              )}
            </button>
          ))}
          </div>

          {/* Footer: extra action always shown when provided (unless explicitly hidden by showExtraWhenEmpty and options exist) */}
          {extraActionLabel && onExtraAction && (!showExtraWhenEmpty || options.length === 0) && (
            <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0">
              <div className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onExtraAction();
                  }}
                  className="w-full text-left text-sm text-orange-500 hover:text-orange-600"
                >
                  {extraActionLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};