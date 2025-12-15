import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Module, CreateModuleInput, UpdateModuleInput } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateModuleInput | UpdateModuleInput) => Promise<void>;
  editData?: Module | null;
}

export const ModuleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editData,
}) => {
  const [formData, setFormData] = useState({
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
  }>({});

  const texts = {
    addModule: 'Add Module',
    editModule: 'Edit Module',
    moduleName: 'Module Name',
    cancel: 'Cancel',
    save: 'Save',
    nameRequired: 'Module name is required',
  };

  // Validation function
  const validateForm = () => {
    const errors: typeof validationErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      errors.name = texts.nameRequired;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear specific validation error
  const clearValidationError = (field: keyof typeof validationErrors) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
      });
    } else {
      setFormData({
        name: '',
      });
    }
    
    // Clear validation errors when modal opens/closes
    setValidationErrors({});
  }, [editData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (editData) {
        await onSave({ ...formData, id: editData.id });
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving module:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
            {editData ? texts.editModule : texts.addModule}
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
              {texts.moduleName}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (e.target.value.trim() && validationErrors.name) {
                  clearValidationError('name');
                }
              }}
              className={`input-enhanced w-full px-3 py-2 sm:py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                validationErrors.name ? 'border-red-500' : ''
              }`}
            />
            {validationErrors.name && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
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
              disabled={loading}
              className="flex-1 px-4 py-2 sm:py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : texts.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};