import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Product, Module, CreateProductModuleInput } from '../../types';
import { CustomDropdown } from '../CustomDropdown';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateProductModuleInput) => Promise<void>;
  products: Product[];
  modules: Module[];
}

export const ProductModuleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  products,
  modules,
}) => {
  const [formData, setFormData] = useState({
    product_id: '',
    module_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [availableModules, setAvailableModules] = useState<Module[]>(modules);

  const texts = {
    assignModule: 'Assign Module to Product',
    product: 'Product',
    module: 'Module',
    cancel: 'Cancel',
    save: 'Assign',
    selectProduct: 'Select Product',
    selectModule: 'Select Module',
  };

  // Get all assigned modules across all products
  const getAllAssignedModules = async (productId: string) => {
    if (!productId) {
      setAvailableModules(modules);
      return;
    }

    try {
      const { getAllProductModules } = await import('../../services/database');
      const allProductModules = await getAllProductModules();
      
      // Get module IDs that are assigned to ANY product (globally)
      const assignedModuleIds = allProductModules
        .filter(pm => pm.is_active)
        .map(pm => pm.module_id);
      
      // Filter out modules that are already assigned to ANY product
      const unassignedModules = modules.filter(m => 
        !assignedModuleIds.includes(m.id) && m.is_active
      );
      
      setAvailableModules(unassignedModules);
    } catch (error) {
      console.error('Error getting assigned modules:', error);
      setAvailableModules(modules.filter(m => m.is_active));
    }
  };

  // Update available modules when product changes
  React.useEffect(() => {
    getAllAssignedModules(formData.product_id);
  }, [formData.product_id, modules]);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ product_id: '', module_id: '' });
      setAvailableModules(modules);
    }
  }, [isOpen, modules]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave(formData);
      setFormData({ product_id: '', module_id: '' });
      onClose();
    } catch (error) {
      console.error('Error assigning module:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (productId: string) => {
    setFormData(prev => ({ ...prev, product_id: productId, module_id: '' }));
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
            {texts.assignModule}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {texts.product}
            </label>
            <CustomDropdown
              options={products.filter(p => p.is_active)}
              selectedValue={formData.product_id || 'all'}
              onValueChange={(value) => handleProductChange(value === 'all' ? '' : value)}
              placeholder={texts.selectProduct}
              allText={texts.selectProduct}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {texts.module}
            </label>
            <div className={!formData.product_id ? 'opacity-50 pointer-events-none' : ''}>
              <CustomDropdown
                options={availableModules}
                selectedValue={formData.module_id || 'all'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, module_id: value === 'all' ? '' : value }))}
                placeholder={texts.selectModule}
                allText={texts.selectModule}
              />
            </div>
            {!formData.product_id && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Please select a product first
              </p>
            )}
            {formData.product_id && availableModules.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All modules are already assigned to this product
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {texts.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.product_id || !formData.module_id || availableModules.length === 0}
              className="flex-1 px-4 py-2 sm:py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Assigning...' : texts.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};