import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Product } from '../types';

interface Props {
  products: Product[];
  selectedProduct: Product | null;
  onProductChange: (product: Product) => void;
  className?: string;
}

export const CustomProductDropdown: React.FC<Props> = ({
  products,
  selectedProduct,
  onProductChange,
  className = '',
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

  const handleProductSelect = (product: Product) => {
    onProductChange(product);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Product Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="select-enhanced w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <div className="flex items-center space-x-3">
          {selectedProduct && (
            <>
              <img
                src={selectedProduct.logo}
                alt={selectedProduct.name}
                className="w-6 h-6 rounded object-cover flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="truncate">{selectedProduct.name}</span>
            </>
          )}
          {!selectedProduct && (
            <span className="text-gray-500 dark:text-gray-400">Select Product</span>
          )}
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-hidden">
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleProductSelect(product)}
              className="dropdown-option w-full px-4 py-3 text-left hover:bg-white/5 dark:hover:bg-white/10 flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={product.logo}
                  alt={product.name}
                  className="w-6 h-6 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-gray-800 dark:text-white truncate">
                  {product.name}
                </span>
              </div>
              {selectedProduct?.id === product.id && (
                <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
              )}
            </button>
          ))}
          </div>
        </div>
      )}
    </div>
  );
};