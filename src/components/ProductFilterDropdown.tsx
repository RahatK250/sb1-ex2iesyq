import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate fixed position + constrain maxHeight to available viewport space
  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const MARGIN = 8;
    const MAX_LIST = 240; // max-h-60 equivalent

    const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;

    if (spaceBelow >= 80 || spaceBelow >= spaceAbove) {
      // Open downward — constrain height to available space
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(MAX_LIST, spaceBelow),
        zIndex: 9999,
      });
    } else {
      // Open upward — constrain height to available space above
      setDropdownStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(MAX_LIST, spaceAbove),
        zIndex: 9999,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      calcPosition();
      window.addEventListener('scroll', calcPosition, true);
      window.addEventListener('resize', calcPosition);
    }
    return () => {
      window.removeEventListener('scroll', calcPosition, true);
      window.removeEventListener('resize', calcPosition);
    };
  }, [isOpen, calcPosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const outsideTrigger = !triggerRef.current?.contains(target);
      const outsideDropdown = !dropdownRef.current?.contains(target);
      if (outsideTrigger && outsideDropdown) {
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

  const dropdownMenu = isOpen ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-y-auto scrollbar-hide"
    >
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
  ) : null;

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
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

      {/* Render via portal so it escapes any overflow:hidden/auto parent */}
      {createPortal(dropdownMenu, document.body)}
    </div>
  );
};
