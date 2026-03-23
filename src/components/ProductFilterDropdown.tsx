import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, LayoutGrid } from 'lucide-react';
import { Product } from '../types';

interface Props {
  products: Product[];
  selectedValue: string | 'all';
  onValueChange: (value: string | 'all') => void;
  allText?: string;
  className?: string;
}

export const ProductFilterDropdown: React.FC<Props> = ({
  products,
  selectedValue,
  onValueChange,
  allText = 'All Products',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedProduct = selectedValue === 'all' ? null : products.find(p => p.id === selectedValue) ?? null;

  const handleSelect = (value: string | 'all') => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="select-enhanced w-full h-[46px] px-4 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedProduct ? (
            <>
              <img
                src={selectedProduct.logo}
                alt={selectedProduct.name}
                className="w-5 h-5 rounded object-cover flex-shrink-0"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="truncate text-sm">{selectedProduct.name}</span>
            </>
          ) : (
            <>
              <LayoutGrid className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{allText}</span>
            </>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {/* All Products option */}
            <button
              type="button"
              onClick={() => handleSelect('all')}
              className="dropdown-option w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <LayoutGrid className="w-3 h-3 text-gray-500 dark:text-gray-300" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-200">{allText}</span>
              </div>
              {selectedValue === 'all' && <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />}
            </button>

            {/* Divider */}
            {products.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-700 mx-3" />
            )}

            {/* Product options */}
            {products.map(product => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelect(product.id)}
                className="dropdown-option w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={product.logo}
                    alt={product.name}
                    className="w-5 h-5 rounded object-cover flex-shrink-0"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{product.name}</span>
                </div>
                {selectedValue === product.id && <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
