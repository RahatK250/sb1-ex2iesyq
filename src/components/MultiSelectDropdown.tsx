import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface Props {
  options: Option[];
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const MultiSelectDropdown: React.FC<Props> = ({
  options,
  selectedValues,
  onValuesChange,
  placeholder = 'Select…',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const toggleOption = (id: string) => {
    if (selectedValues.includes(id)) {
      onValuesChange(selectedValues.filter(v => v !== id));
    } else {
      onValuesChange([...selectedValues, id]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValuesChange([]);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const opt = options.find(o => o.id === selectedValues[0]);
      return opt?.name ?? placeholder;
    }
    return `${selectedValues.length} selected`;
  };

  const hasSelection = selectedValues.length > 0;

  return (
    <div
      className={`relative ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      ref={dropdownRef}
    >
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(o => !o)}
        disabled={disabled}
        className="select-enhanced w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm flex items-center justify-between gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={`truncate text-sm ${hasSelection ? '' : 'text-gray-400 dark:text-gray-500'}`}>
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasSelection && (
            <span
              role="button"
              tabIndex={0}
              onClick={clearAll}
              onKeyDown={e => e.key === 'Enter' && clearAll(e as any)}
              className="p-0.5 rounded text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown list */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="px-3 pt-2.5 pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="flex-1 text-sm bg-transparent text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none"
                onClick={e => e.stopPropagation()}
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto scrollbar-hide">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center italic">
                No options available
              </div>
            ) : (() => {
              const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
              return filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center italic">
                  No results for "{search}"
                </div>
              ) : filtered.map(option => {
                const checked = selectedValues.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleOption(option.id)}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/10 flex items-center gap-3 transition-colors"
                  >
                    <span
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked
                          ? 'bg-orange-500 border-orange-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </span>
                    <span className="text-sm text-gray-800 dark:text-white truncate">
                      {option.name}
                    </span>
                  </button>
                );
              });
            })()}
          </div>

          {/* Footer: count + Done */}
          {options.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 flex items-center justify-between bg-white dark:bg-gray-800">
              <span className="text-xs text-gray-400">
                {selectedValues.length} of {options.length} selected
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-orange-500 hover:text-orange-600 px-2 py-1 rounded transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
