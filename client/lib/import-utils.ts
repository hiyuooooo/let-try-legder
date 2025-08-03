import * as XLSX from 'xlsx';
import { LedgerEntry, ImportResult } from '@shared/types';
import { validateDateFormat, parseDateString } from './storage';

// Import ledger entries from Excel file
export const importFromExcel = (file: File, accountId: string): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const result: ImportResult = {
          success: true,
          importedCount: 0,
          skippedCount: 0,
          errors: []
        };

        // Find header row and validate columns
        let headerRowIndex = -1;
        let dateColIndex = -1;
        let billColIndex = -1;
        let cashColIndex = -1;

        // Look for headers in first few rows
        for (let i = 0; i < Math.min(5, rawData.length); i++) {
          const row = rawData[i] as any[];
          if (row && Array.isArray(row)) {
            for (let j = 0; j < row.length; j++) {
              const cell = String(row[j] || '').toLowerCase().trim();
              if (cell.includes('date')) {
                headerRowIndex = i;
                dateColIndex = j;
              } else if (cell.includes('bill')) {
                billColIndex = j;
              } else if (cell.includes('cash')) {
                cashColIndex = j;
              }
            }
            
            // If we found all required columns, break
            if (headerRowIndex >= 0 && dateColIndex >= 0 && billColIndex >= 0 && cashColIndex >= 0) {
              break;
            }
          }
        }

        if (headerRowIndex === -1 || dateColIndex === -1 || billColIndex === -1 || cashColIndex === -1) {
          result.success = false;
          result.errors.push('Required columns not found. Excel file must have Date, Bill, and Cash columns.');
          resolve(result);
          return;
        }

        const importedEntries: LedgerEntry[] = [];

        // Process data rows
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i] as any[];
          if (!row || !Array.isArray(row)) continue;

          const dateValue = row[dateColIndex];
          const billValue = row[billColIndex];
          const cashValue = row[cashColIndex];

          // Skip empty rows
          if (!dateValue && !billValue && !cashValue) {
            continue;
          }

          // Validate and parse date
          let dateStr = '';
          let parsedDate: Date | null = null;

          if (typeof dateValue === 'string') {
            dateStr = dateValue.trim();
          } else if (typeof dateValue === 'number') {
            // Excel date number to JS date
            const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
            dateStr = excelDate.toLocaleDateString('en-GB');
          } else if (dateValue instanceof Date) {
            dateStr = dateValue.toLocaleDateString('en-GB');
          }

          if (!validateDateFormat(dateStr)) {
            result.errors.push(`Row ${i + 1}: Invalid date format "${dateValue}". Must be dd/mm/yyyy.`);
            result.skippedCount++;
            continue;
          }

          parsedDate = parseDateString(dateStr);
          if (!parsedDate) {
            result.errors.push(`Row ${i + 1}: Could not parse date "${dateStr}".`);
            result.skippedCount++;
            continue;
          }

          // Validate and parse bill amount
          const bill = parseFloat(String(billValue || '0'));
          if (isNaN(bill) || bill < 0) {
            result.errors.push(`Row ${i + 1}: Invalid bill amount "${billValue}". Must be a positive number.`);
            result.skippedCount++;
            continue;
          }

          // Validate and parse cash amount
          const cash = parseFloat(String(cashValue || '0'));
          if (isNaN(cash) || cash < 0) {
            result.errors.push(`Row ${i + 1}: Invalid cash amount "${cashValue}". Must be a positive number.`);
            result.skippedCount++;
            continue;
          }

          // Calculate total and profit/loss
          const total = bill - cash;
          const profitLoss = total < 0 ? 'Profit' : total > 0 ? 'Loss' : '';

          // Create ledger entry
          const entry: LedgerEntry = {
            id: `import-${Date.now()}-${i}`,
            date: parsedDate,
            bill,
            cash,
            total,
            profitLoss: profitLoss as 'Profit' | 'Loss' | '',
            notes: `Imported from Excel on ${new Date().toLocaleDateString('en-GB')}`,
            accountId
          };

          importedEntries.push(entry);
          result.importedCount++;
        }

        if (result.importedCount === 0 && result.errors.length === 0) {
          result.success = false;
          result.errors.push('No valid data found in the Excel file.');
        }

        resolve({
          ...result,
          entries: importedEntries
        } as any);

      } catch (error) {
        reject(new Error(`Failed to process Excel file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

// Validate Excel file before import
export const validateExcelFile = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!file) {
      resolve(false);
      return;
    }

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    const validExtensions = ['.xlsx', '.xls'];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    resolve(hasValidType || hasValidExtension);
  });
};

// Create sample Excel template for download
export const downloadExcelTemplate = (): void => {
  const templateData = [
    ['Date', 'Bill', 'Cash', 'Notes'],
    ['25/01/2024', 5000, 3000, 'Sample entry 1'],
    ['26/01/2024', 8000, 12000, 'Sample entry 2'],
    ['27/01/2024', 3000, 2500, 'Sample entry 3']
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  const wb = XLSX.utils.book_new();

  // Style the header row
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellAddress]) {
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'CCCCCC' } },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
    }
  }

  // Set column widths
  ws['!cols'] = [
    { width: 12 }, // Date
    { width: 10 }, // Bill
    { width: 10 }, // Cash
    { width: 25 }  // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Ledger Template');
  XLSX.writeFile(wb, 'ledger-import-template.xlsx');
};
