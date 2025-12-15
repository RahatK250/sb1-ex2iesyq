import React, { useState, useEffect } from 'react';
import { X, Upload, Link } from 'lucide-react';
import { Product, CreateProductInput, UpdateProductInput } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateProductInput | UpdateProductInput) => Promise<void>;
  editData?: Product | null;
}

export const ProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editData,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
  });
  const [logoMethod, setLogoMethod] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
  }>({});

  const texts = {
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    productName: 'Product Name',
    logoUrl: 'Logo URL',
    cancel: 'Cancel',
    save: 'Save',
    nameRequired: 'Product name is required',
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
        logo: editData.logo,
      });
      setPreviewUrl(editData.logo);
      setLogoMethod('url');
    } else {
      setFormData({
        name: '',
        logo: '',
      });
      setPreviewUrl('');
      setSelectedFile(null);
      setLogoMethod('url');
    }
    
    // Clear validation errors when modal opens/closes
    setValidationErrors({});
  }, [editData, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        setFormData(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, logo: url }));
    setPreviewUrl(url);
  };
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
      console.error('Error saving product:', error);
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
            {editData ? texts.editProduct : texts.addProduct}
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
              {texts.productName}
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
              {texts.logoUrl}
            </label>
            
            {/* Logo Method Selection */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setLogoMethod('url')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  logoMethod === 'url'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Link className="w-4 h-4" />
                URL
              </button>
              <button
                type="button"
                onClick={() => setLogoMethod('file')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  logoMethod === 'file'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload File
              </button>
            </div>

            {/* URL Input */}
            {logoMethod === 'url' && (
              <input
                type="url"
                value={formData.logo}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="input-enhanced w-full px-3 py-2 sm:py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white file:mr-2 sm:file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs sm:file:text-sm file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            )}

            {/* File Upload */}
            {logoMethod === 'file' && (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="input-enhanced w-full px-3 py-2 sm:py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white file:mr-2 sm:file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs sm:file:text-sm file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {!selectedFile && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select an image file (PNG, JPG, GIF, etc.)
                  </p>
                )}
              </div>
            )}
          </div>

          {previewUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview
              </label>
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded border border-gray-300 dark:border-gray-600"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

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