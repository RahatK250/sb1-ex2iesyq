import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
  editData?: Category | null;
}

export const CategoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editData,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    color: '#10B981',
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    tag?: string;
  }>({});

  const texts = {
    addCategory: 'Add Category',
    editCategory: 'Edit Category',
    categoryName: 'Category Name',
    tag: 'Tag',
    color: 'Color',
    cancel: 'Cancel',
    save: 'Save',
    nameRequired: 'Category name is required',
    tagRequired: 'Tag is required',
  };

  // Validation function
  const validateForm = () => {
    const errors: typeof validationErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      errors.name = texts.nameRequired;
    }
    
    // Validate tag
    if (!formData.tag.trim()) {
      errors.tag = texts.tagRequired;
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

  const predefinedColors = [
    '#10B981', // Green
    '#EF4444', // Red
    '#F59E0B', // Yellow
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        tag: editData.tag,
        color: editData.color,
      });
    } else {
      setFormData({
        name: '',
        tag: '',
        color: '#10B981',
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
      console.error('Error saving category:', error);
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
            {editData ? texts.editCategory : texts.addCategory}
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
              {texts.categoryName}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {texts.tag}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={formData.tag}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, tag: e.target.value }));
                if (e.target.value.trim() && validationErrors.tag) {
                  clearValidationError('tag');
                }
              }}
              className={`input-enhanced w-full px-3 py-2 sm:py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                validationErrors.tag ? 'border-red-500' : ''
              }`}
            />
            {validationErrors.tag && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.tag}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {texts.color}
            </label>
            <div className="grid grid-cols-4 sm:flex gap-2 mb-3">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded border-2 ${
                    formData.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="input-enhanced w-full h-10 sm:h-12 rounded-lg"
            />
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
            <span
              className="inline-block px-2 py-1 rounded text-xs sm:text-sm font-medium text-white break-words"
              style={{ backgroundColor: formData.color }}
            >
              {formData.tag || 'Tag'}
            </span>
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