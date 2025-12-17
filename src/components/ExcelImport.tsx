import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Product, Module, Category } from '../types';
import { useDatabase } from '../hooks/useDatabase';
import { Toast } from './Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  modules: Module[];
  categories: Category[];
  selectedProduct: Product;
  onGetModulesByProduct: (productId: string) => Promise<Module[]>;
  onImportSuccess: () => void;
}

interface ImportRow {
  'Test Case Name': string;
  'Description': string;
  'Product': string;
  'Module': string;
  'Category': string;
  'Test Data Field 1 Key': string;
  'Test Data Field 1 Value': string;
  'Test Data Field 2 Key': string;
  'Test Data Field 2 Value': string;
  'Test Data Field 3 Key': string;
  'Test Data Field 3 Value': string;
  'Test Data Field 4 Key': string;
  'Test Data Field 4 Value': string;
  'Test Data Field 5 Key': string;
  'Test Data Field 5 Value': string;
  'Expected Result': string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export const ExcelImport: React.FC<Props> = ({
  isOpen,
  onClose,
  products,
  modules,
  categories,
  selectedProduct,
  onGetModulesByProduct,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    total: number;
  } | null>(null);
  const [toast, setToast] = useState({ 
    isVisible: false, 
    message: '', 
    type: 'success' as 'success' | 'error' | 'warning' 
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createTestData } = useDatabase();

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      // Clear all states when modal opens
      setFile(null);
      setValidationErrors([]);
      setImportResults(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const texts = {
    importExcel: 'Import Excel File',
    downloadTemplate: 'Download Template',
    selectFile: 'Select Excel File',
    importData: 'Import Data',
    importing: 'Importing...',
    close: 'Close',
    validationErrors: 'Validation Errors',
    importResults: 'Import Results',
    successfulImports: 'Successful imports',
    failedImports: 'Failed imports',
    totalRows: 'Total rows',
    templateInfo: 'Template Information',
    templateDescription: 'Download the template file to see the correct format for importing test data.',
    fileRequirements: 'File Requirements',
    supportedFormats: 'Supported formats: .xlsx, .xls',
    maxFileSize: 'Maximum file size: 10MB',
    requiredFields: 'Required fields: Test Case Name, Product, Module, Category, Expected Result',
    testDataFields: 'Test Data Fields: Up to 5 key-value pairs supported',
    invalidFileType: 'Please select a valid Excel file (.xlsx or .xls)',
    fileTooLarge: 'File size must be less than 10MB',
    fileReadError: 'Error reading Excel file. Please check the file format and try again.',
    emptyFileError: 'Excel file is empty or has no data rows',
    validationErrorsFound: 'Found validation errors. Please fix them before importing.',
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ isVisible: true, message, type });
  };

  const closeToast = () => {
    setToast({ isVisible: false, message: '', type: 'success' });
  };

  // Generate and download template Excel file
  const downloadTemplate = () => {
    try {
    const templateData: ImportRow[] = [
      {
        'Test Case Name': 'Login Test Case',
        'Description': 'Test user login functionality',
        'Product': selectedProduct.name,
        'Module': 'Authentication',
        'Category': 'Positive case',
        'Test Data Field 1 Key': 'username',
        'Test Data Field 1 Value': 'testuser@example.com',
        'Test Data Field 2 Key': 'password',
        'Test Data Field 2 Value': 'password123',
        'Test Data Field 3 Key': 'browser',
        'Test Data Field 3 Value': 'Chrome',
        'Test Data Field 4 Key': '',
        'Test Data Field 4 Value': '',
        'Test Data Field 5 Key': '',
        'Test Data Field 5 Value': '',
        'Expected Result': 'User successfully logged in',
      },
      {
        'Test Case Name': 'Invalid Login Test',
        'Description': 'Test login with invalid credentials',
        'Product': selectedProduct.name,
        'Module': 'Authentication',
        'Category': 'Negative case',
        'Test Data Field 1 Key': 'username',
        'Test Data Field 1 Value': 'invalid@example.com',
        'Test Data Field 2 Key': 'password',
        'Test Data Field 2 Value': 'wrongpassword',
        'Test Data Field 3 Key': '',
        'Test Data Field 3 Value': '',
        'Test Data Field 4 Key': '',
        'Test Data Field 4 Value': '',
        'Test Data Field 5 Key': '',
        'Test Data Field 5 Value': '',
        'Expected Result': 'Error message displayed',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Data Template');

    // Set column widths
    const colWidths = [
      { wch: 25 }, // Test Case Name
      { wch: 30 }, // Description
      { wch: 15 }, // Product
      { wch: 15 }, // Module
      { wch: 15 }, // Category
      { wch: 20 }, // Test Data Field 1 Key
      { wch: 25 }, // Test Data Field 1 Value
      { wch: 20 }, // Test Data Field 2 Key
      { wch: 25 }, // Test Data Field 2 Value
      { wch: 20 }, // Test Data Field 3 Key
      { wch: 25 }, // Test Data Field 3 Value
      { wch: 20 }, // Test Data Field 4 Key
      { wch: 25 }, // Test Data Field 4 Value
      { wch: 20 }, // Test Data Field 5 Key
      { wch: 25 }, // Test Data Field 5 Value
      { wch: 30 }, // Expected Result
    ];
    worksheet['!cols'] = colWidths;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `test-data-template-${selectedProduct.name.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
      showToast('Template downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating template:', error);
      showToast('Failed to generate template file', 'error');
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        '.xlsx',
        '.xls'
      ];
      
      const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
      const isValidType = allowedTypes.includes(selectedFile.type) || 
                         fileExtension === 'xlsx' || 
                         fileExtension === 'xls';
      
      if (!isValidType) {
        showToast(texts.invalidFileType, 'error');
        return;
      }

      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        showToast(texts.fileTooLarge, 'error');
        return;
      }

      setFile(selectedFile);
      setValidationErrors([]);
      setImportResults(null);
      showToast('File selected successfully!', 'success');
    }
  };

  // Validate imported data
  const validateData = async (data: ImportRow[]): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    const productModulesMap = new Map<string, Module[]>();

    // Pre-load modules for all products mentioned in the data
    const uniqueProducts = [...new Set(data.map(row => row.Product))];
    for (const productName of uniqueProducts) {
      const product = products.find(p => p.name === productName && p.is_active);
      if (product) {
        try {
          const productModules = await onGetModulesByProduct(product.id);
          productModulesMap.set(productName, productModules);
        } catch (error) {
          console.error(`Error loading modules for product ${productName}:`, error);
        }
      }
    }

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row number (starting from 2, accounting for header)

      // Required field validation
      if (!row['Test Case Name']?.trim()) {
        errors.push({
          row: rowNumber,
          field: 'Test Case Name',
          message: 'Test Case Name is required',
          type: 'error'
        });
      }

      if (!row['Product']?.trim()) {
        errors.push({
          row: rowNumber,
          field: 'Product',
          message: 'Product is required',
          type: 'error'
        });
      }

      if (!row['Module']?.trim()) {
        errors.push({
          row: rowNumber,
          field: 'Module',
          message: 'Module is required',
          type: 'error'
        });
      }

      if (!row['Category']?.trim()) {
        errors.push({
          row: rowNumber,
          field: 'Category',
          message: 'Category is required',
          type: 'error'
        });
      }

      if (!row['Expected Result']?.trim()) {
        errors.push({
          row: rowNumber,
          field: 'Expected Result',
          message: 'Expected Result is required',
          type: 'error'
        });
      }

      // Product validation
      if (row['Product']?.trim()) {
        const product = products.find(p => p.name === row['Product'] && p.is_active);
        if (!product) {
          errors.push({
            row: rowNumber,
            field: 'Product',
            message: `Product "${row['Product']}" not found or inactive`,
            type: 'error'
          });
        }
      }

      // Module validation
      if (row['Product']?.trim() && row['Module']?.trim()) {
        const productModules = productModulesMap.get(row['Product']) || [];
        const module = productModules.find(m => m.name === row['Module'] && m.is_active);
        if (!module) {
          errors.push({
            row: rowNumber,
            field: 'Module',
            message: `Module "${row['Module']}" not found or not assigned to product "${row['Product']}"`,
            type: 'error'
          });
        }
      }

      // Category validation
      if (row['Category']?.trim()) {
        const category = categories.find(c => c.name === row['Category'] && c.is_active);
        if (!category) {
          errors.push({
            row: rowNumber,
            field: 'Category',
            message: `Category "${row['Category']}" not found or inactive`,
            type: 'error'
          });
        }
      }

      // Test data fields validation
      const testDataFields = [];
      for (let i = 1; i <= 5; i++) {
        const key = row[`Test Data Field ${i} Key` as keyof ImportRow];
        const value = row[`Test Data Field ${i} Value` as keyof ImportRow];
        
        if (key?.trim() && !value?.trim()) {
          errors.push({
            row: rowNumber,
            field: `Test Data Field ${i}`,
            message: `Test Data Field ${i} has key but no value`,
            type: 'warning'
          });
        } else if (!key?.trim() && value?.trim()) {
          errors.push({
            row: rowNumber,
            field: `Test Data Field ${i}`,
            message: `Test Data Field ${i} has value but no key`,
            type: 'warning'
          });
        } else if (key?.trim() && value?.trim()) {
          testDataFields.push({ key: key.trim(), value: value.trim() });
        }
      }

      if (testDataFields.length === 0) {
        errors.push({
          row: rowNumber,
          field: 'Test Data Fields',
          message: 'At least one test data field is required',
          type: 'error'
        });
      }
    });

    return errors;
  };

  // Import data from Excel
  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setValidationErrors([]);
    setImportResults(null);

    try {
      // Read Excel file
      const fileBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { 
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
      });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        showToast('Excel file has no worksheets', 'error');
        return;
      }
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      if (!worksheet) {
        showToast('Unable to read worksheet data', 'error');
        return;
      }
      
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      }) as any[][];

      const jsonData: ImportRow[] = rawData.slice(1) // Remove header row
      .map((row: any[]) => ({
        'Test Case Name': String(row[0] || ''),
        'Description': String(row[1] || ''),
        'Product': String(row[2] || ''),
        'Module': String(row[3] || ''),
        'Category': String(row[4] || ''),
        'Test Data Field 1 Key': String(row[5] || ''),
        'Test Data Field 1 Value': String(row[6] || ''),
        'Test Data Field 2 Key': String(row[7] || ''),
        'Test Data Field 2 Value': String(row[8] || ''),
        'Test Data Field 3 Key': String(row[9] || ''),
        'Test Data Field 3 Value': String(row[10] || ''),
        'Test Data Field 4 Key': String(row[11] || ''),
        'Test Data Field 4 Value': String(row[12] || ''),
        'Test Data Field 5 Key': String(row[13] || ''),
        'Test Data Field 5 Value': String(row[14] || ''),
        'Expected Result': String(row[15] || ''),
      }))
      .filter(row => row['Test Case Name'] || row['Product'] || row['Module']); // Filter out completely empty rows

      if (jsonData.length === 0) {
        showToast(texts.emptyFileError, 'error');
        return;
      }

      // Validate data
      const errors = await validateData(jsonData);
      setValidationErrors(errors);

      // Check if there are any blocking errors
      const blockingErrors = errors.filter(error => error.type === 'error');
      if (blockingErrors.length > 0) {
        showToast(`${texts.validationErrorsFound} (${blockingErrors.length} errors)`, 'error');
        return;
      }

      // Import data
      let successCount = 0;
      let failedCount = 0;

      for (const row of jsonData) {
        try {
          // Find related entities
          const product = products.find(p => p.name === row['Product'] && p.is_active);
          if (!product) {
            failedCount++;
            continue;
          }
          
          const productModules = await onGetModulesByProduct(product!.id);
          const module = productModules.find(m => m.name === row['Module'] && m.is_active);
          if (!module) {
            failedCount++;
            continue;
          }
          
          const category = categories.find(c => c.name === row['Category'] && c.is_active);
          if (!category) {
            failedCount++;
            continue;
          }

          // Build test data string
          const testDataFields = [];
          for (let i = 1; i <= 5; i++) {
            const key = row[`Test Data Field ${i} Key` as keyof ImportRow];
            const value = row[`Test Data Field ${i} Value` as keyof ImportRow];
            if (key?.trim() && value?.trim()) {
              testDataFields.push(`${key.trim()}: "${value.trim()}"`);
            }
          }

          if (testDataFields.length === 0) {
            failedCount++;
            continue;
          }
          const testDataString = testDataFields.join('\n');

          // Create test data
          await createTestData({
            name: row['Test Case Name'].trim(),
            description: row['Description']?.trim() || '',
            product_id: product!.id,
            module_id: module!.id,
            category_id: category!.id,
            test_data: testDataString,
            expected: row['Expected Result'].trim(),
          });

          successCount++;
        } catch (error) {
          console.error('Error importing row:', error);
          failedCount++;
        }
      }

      setImportResults({
        success: successCount,
        failed: failedCount,
        total: jsonData.length,
      });

      if (successCount > 0) {
        onImportSuccess();
        showToast(`Successfully imported ${successCount} test cases!`, 'success');
      } else {
        showToast('No test cases were imported', 'warning');
      }

    } catch (error) {
      console.error('Error reading Excel file:', error);
      showToast(texts.fileReadError, 'error');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={closeToast}
        />
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {texts.importExcel}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  {texts.templateInfo}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  {texts.templateDescription}
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{texts.downloadTemplate}</span>
                </button>
              </div>
            </div>
          </div>

          {/* File Requirements */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 dark:text-white mb-3">
              {texts.fileRequirements}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• {texts.supportedFormats}</li>
              <li>• {texts.maxFileSize}</li>
              <li>• {texts.requiredFields}</li>
              <li>• {texts.testDataFields}</li>
            </ul>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {texts.selectFile}
            </label>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  {file ? file.name : 'Choose Excel file'}
                </span>
              </button>
              {file && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>{importing ? texts.importing : texts.importData}</span>
                </button>
              )}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-medium text-red-800 dark:text-red-200">
                  {texts.validationErrors} ({validationErrors.length})
                </h3>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {validationErrors.map((error, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border-l-4 ${
                      error.type === 'error'
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-500'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        error.type === 'error'
                          ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                          : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                      }`}>
                        Row {error.row}
                      </span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          error.type === 'error'
                            ? 'text-red-800 dark:text-red-200'
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {error.field}
                        </p>
                        <p className={`text-sm ${
                          error.type === 'error'
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {error.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-medium text-green-800 dark:text-green-200">
                  {texts.importResults}
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {importResults.success}
                  </div>
                  <div className="text-green-700 dark:text-green-300">
                    {texts.successfulImports}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {importResults.failed}
                  </div>
                  <div className="text-red-700 dark:text-red-300">
                    {texts.failedImports}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {importResults.total}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300">
                    {texts.totalRows}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {texts.close}
          </button>
        </div>
      </div>
    </div>
  );
};