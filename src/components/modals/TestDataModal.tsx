import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Minimize2, Maximize2 } from 'lucide-react';
import { Product, Module, Category, TestData, CreateTestDataInput, UpdateTestDataInput } from '../../types';
import { CustomDropdown } from '../CustomDropdown';
import { CustomProductDropdown } from '../CustomProductDropdown';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTestDataInput | UpdateTestDataInput) => Promise<void>;
  products: Product[];
  modules: Module[];
  categories: Category[];
  editData?: TestData | null;
  onGetModulesByProduct: (productId: string) => Promise<Module[]>;
}

interface TestDataField {
  key: string;
  value: string;
}

export const TestDataModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  products,
  modules,
  categories,
  editData,
  onGetModulesByProduct,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    product_id: null as string | null,
    module_id: null as string | null,
    category_id: null as string | null,
    expected: '',
  });
  const [testDataFields, setTestDataFields] = useState<TestDataField[]>([
    { key: '', value: '' }
  ]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset minimize state and handle background scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false); // Always open maximized
    }
  }, [isOpen]);

  // Handle background scroll based on minimize state
  useEffect(() => {
    if (isOpen) {
      if (isMinimized) {
        // Allow background scroll when minimized
        document.body.style.overflow = 'unset';
        document.documentElement.style.overflow = 'unset';
      } else {
        // Prevent background scroll when maximized
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      }
    } else {
      // Restore background scroll when modal is closed
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    
    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [isOpen, isMinimized]);

  const texts = {
    addTestData: 'Create Test Data',
    editTestData: 'Edit Test Data',
    testCaseName: 'Test Case Name',
    description: 'Description',
    product: 'Product',
    module: 'Module',
    category: 'Category',
    testData: 'Test Data Fields',
    expected: 'Expected Result',
    cancel: 'Cancel',
    save: 'Save',
    selectProduct: 'Select Product',
    selectModule: 'Select Module',
    selectCategory: 'Select Category',
    fieldKey: 'Field Name',
    fieldValue: 'Field Value',
    addField: 'Add Field',
    removeField: 'Remove Field',
    // Validation messages
    productRequired: 'Please select a product',
    moduleRequired: 'Please select a module',
    categoryRequired: 'Please select a category',
    testDataRequired: 'Please add at least one test data field',
    fieldKeyRequired: 'Field name is required',
    fieldValueRequired: 'Field value is required',
    nameRequired: 'Test case name is required',
    expectedRequired: 'Expected result is required',
  };

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    expected?: string;
    product?: string;
    module?: string;
    category?: string;
    testData?: string;
  }>({});

  // Get modules for selected product
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  
  const getModulesForProduct = async (productId: string) => {
    try {
      const productModules = await onGetModulesByProduct(productId);
      const activeProductModules = productModules.filter(m => m.is_active);
      setAvailableModules(activeProductModules);
      console.log('Loaded modules for product:', productId, activeProductModules);
    } catch (error) {
      console.error('Error loading modules for product:', error);
      setAvailableModules([]);
    }
  };
  
  useEffect(() => {
    console.log('Product changed in TestDataModal:', formData.product_id);
    if (editData) {
      // Check if this is a copy operation
      const isCopyOperation = !editData.id;
      
      if (isCopyOperation) {
        // For copy operation, create new data
        setFormData({
          name: editData.name,
          description: editData.description,
          product_id: editData.product_id,
          module_id: editData.module_id,
          category_id: editData.category_id,
          expected: editData.expected,
        });
      } else {
        // For edit operation, use existing data as is
        setFormData({
          name: editData.name,
          description: editData.description,
          product_id: editData.product_id,
          module_id: editData.module_id,
          category_id: editData.category_id,
          expected: editData.expected,
        });
      }

      // Parse existing test data into fields
      const fields: TestDataField[] = [];
      const lines = editData.test_data.split('\n');
      lines.forEach(line => {
        const [key, value] = line.split(': ');
        if (key && value) {
          fields.push({ 
            key: key.trim(), 
            value: value.replace(/"/g, '').trim() 
          });
        }
      });
      setTestDataFields(fields.length > 0 ? fields : [{ key: '', value: '' }]);

      // Load modules for the selected product
      if (editData.product_id) {
        console.log('Loading modules for edit data product:', editData.product_id);
        getModulesForProduct(editData.product_id);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        product_id: null,
        module_id: null,
        category_id: null,
        expected: '',
      });
      setTestDataFields([{ key: '', value: '' }]);
      setAvailableModules([]);
    }
    
    // Clear validation errors when modal opens/closes
    setValidationErrors({});
  }, [editData, isOpen]);

  // Load modules when product changes
  useEffect(() => {
    if (formData.product_id) {
      console.log('Loading modules for selected product:', formData.product_id);
      getModulesForProduct(formData.product_id);
    } else {
      console.log('No product selected, clearing modules');
      setAvailableModules([]);
    }
  }, [formData.product_id]);

  const handleProductChange = (productId: string) => {
    console.log('Product changed:', productId);
    setFormData(prev => ({ 
      ...prev, 
      product_id: productId === 'all' ? null : productId, 
      module_id: null // Reset module when product changes
    }));
  };

  // Validation function
  const validateForm = () => {
    const errors: typeof validationErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      errors.name = texts.nameRequired;
    }
    
    // Validate expected
    if (!formData.expected.trim()) {
      errors.expected = texts.expectedRequired;
    }
    
    // Validate product
    if (!formData.product_id) {
      errors.product = texts.productRequired;
    }
    
    // Validate module
    if (!formData.module_id) {
      errors.module = texts.moduleRequired;
    }
    
    // Validate category
    if (!formData.category_id) {
      errors.category = texts.categoryRequired;
    }
    
    // Validate test data fields
    const validFields = testDataFields.filter(field => field.key.trim() && field.value.trim());
    if (validFields.length === 0) {
      errors.testData = texts.testDataRequired;
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
  const addField = () => {
    setTestDataFields([...testDataFields, { key: '', value: '' }]);
  };

  const removeField = (index: number) => {
    if (testDataFields.length > 1) {
      setTestDataFields(testDataFields.filter((_, i) => i !== index));
    }
  };

  const updateField = (index: number, field: 'key' | 'value', value: string) => {
    const updatedFields = [...testDataFields];
    updatedFields[index][field] = value;
    setTestDataFields(updatedFields);
    
    // Clear test data validation error when user starts typing
    if (value.trim() && validationErrors.testData) {
      clearValidationError('testData');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Convert fields to test_data string
      const testDataString = testDataFields
        .filter(field => field.key && field.value)
        .map(field => `${field.key}: "${field.value}"`)
        .join('\n');

      const dataToSave = {
        ...formData,
        test_data: testDataString,
      };

      // Check if this is an edit operation (has ID) or create operation (no ID)
      if (editData?.id) {
        await onSave({ ...dataToSave, id: editData.id });
      } else {
        // This is a create operation (either new data or copy)
        await onSave(dataToSave);
      }
      onClose();
    } catch (error) {
      console.error('Error saving test data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed flex z-50 ${
      isMinimized 
        ? 'bottom-6 right-6 inset-auto bg-transparent'
        : 'inset-0 items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50'
    }`}>
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl ${
        isMinimized 
          ? 'w-80 h-14 overflow-hidden' 
          : 'w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto'
      }`}>
        <div className={`flex items-center p-6 border-b border-gray-200 dark:border-gray-700 ${
          isMinimized ? 'justify-center items-center h-14 p-4' : 'justify-between'
        }`}>
          <h2 className={`text-lg sm:text-xl font-semibold text-gray-800 dark:text-white ${
            isMinimized ? 'flex-1 text-left text-base' : ''
          }`}>
            {editData && editData.id ? texts.editTestData : texts.addTestData}
          </h2>
          <div className={`flex items-center space-x-2 ${
            isMinimized ? 'absolute right-4 top-1/2 transform -translate-y-1/2' : ''
          }`}>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-5 h-5" />
              ) : (
                <Minimize2 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {texts.testCaseName}
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
                {texts.expected}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.expected}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, expected: e.target.value }));
                  if (e.target.value.trim() && validationErrors.expected) {
                    clearValidationError('expected');
                  }
                }}
                className={`input-enhanced w-full px-3 py-2 sm:py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                  validationErrors.expected ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.expected && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.expected}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {texts.description}
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="textarea-enhanced w-full px-3 py-2 sm:py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
            />
          </div>

          {/* Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {texts.product}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <CustomProductDropdown
                products={products.filter(p => p.is_active)}
                selectedProduct={formData.product_id ? products.find(p => p.id === formData.product_id) || null : null}
                onProductChange={(product) => {
                  handleProductChange(product.id);
                  clearValidationError('product');
                }}
              />
              {validationErrors.product && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.product}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {texts.module}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className={!formData.product_id ? 'opacity-50 pointer-events-none' : ''}>
                <CustomDropdown
                  options={availableModules}
                  selectedValue={formData.module_id || 'all'}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, module_id: value === 'all' ? null : value }));
                    if (value !== 'all') clearValidationError('module');
                  }}
                  placeholder={texts.selectModule}
                  allText={texts.selectModule}
                />
              </div>
              {validationErrors.module && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.module}</p>
              )}
              {!formData.product_id && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Please select a product first
                </p>
              )}
              {formData.product_id && availableModules.length === 0 && (
                <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                  No modules assigned to this product. Please assign modules in Settings first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {texts.category}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <CustomDropdown
                options={categories}
                selectedValue={formData.category_id || 'all'}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, category_id: value === 'all' ? null : value }));
                  if (value !== 'all') clearValidationError('category');
                }}
                placeholder={texts.selectCategory}
                allText={texts.selectCategory}
              />
              {validationErrors.category && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.category}</p>
              )}
            </div>
          </div>

          {/* Test Data Fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {texts.testData}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <button
                type="button"
                onClick={addField}
                className="flex items-center gap-2 px-3 py-1.5 sm:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                {texts.addField}
              </button>
            </div>
            
            {validationErrors.testData && (
              <p className="text-red-500 text-sm mb-3">{validationErrors.testData}</p>
            )}

            <div className="space-y-3 max-h-48 sm:max-h-60 overflow-y-auto">
              {testDataFields.map((field, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder={`${texts.fieldKey || 'Field Name'} *`}
                      value={field.key}
                      onChange={(e) => updateField(index, 'key', e.target.value)}
                      className={`input-enhanced w-full px-3 py-2 sm:py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                        !field.key.trim() && validationErrors.testData ? 'border-red-500' : ''
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder={`${texts.fieldValue || 'Field Value'} *`}
                      value={field.value}
                      onChange={(e) => updateField(index, 'value', e.target.value)}
                      className={`input-enhanced w-full px-3 py-2 sm:py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                        !field.value.trim() && validationErrors.testData ? 'border-red-500' : ''
                      }`}
                    />
                  </div>
                  {testDataFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors self-center sm:self-auto"
                      title={texts.removeField}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
        )}
      </div>
    </div>
  );
};