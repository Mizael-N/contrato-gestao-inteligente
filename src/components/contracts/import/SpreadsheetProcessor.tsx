import { Contract } from '@/types/contract';
import { extractContractFromSpreadsheetDataIntelligent } from '@/utils/intelligentSpreadsheetExtractor';

export const processSpreadsheet = async (
  file: File,
  setImporting: (importing: boolean) => void,
  setPreview: (preview: Partial<Contract>[]) => void,
  setError: (error: string) => void,
  setProgress?: (progress: { stage: string; progress: number; message: string }) => void
) => {
  setImporting(true);
  setError('');
  
  console.log('🚀 ENHANCED SPREADSHEET PROCESSING:', {
    nome: file.name,
    tipo: file.type,
    tamanho: `${(file.size / 1024).toFixed(2)} KB`
  });
  
  try {
    setProgress?.({ stage: 'loading', progress: 10, message: '📄 Loading file...' });
    
    // Basic validations
    if (file.size === 0) {
      throw new Error('File is empty');
    }
    
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('File too large. Limit: 20MB');
    }
    
    console.log('📚 Loading XLSX library...');
    const XLSX = await import('xlsx');
    console.log('✅ XLSX loaded');
    
    setProgress?.({ stage: 'reading', progress: 20, message: '📖 Reading data...' });
    
    const arrayBuffer = await file.arrayBuffer();
    console.log(`📄 File read: ${arrayBuffer.byteLength} bytes`);
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Could not read file');
    }
    
    setProgress?.({ stage: 'parsing', progress: 30, message: '🧠 Analyzing structure...' });
    
    // Enhanced configuration for better date handling
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellDates: false, // We'll handle dates ourselves
      cellNF: false,
      cellText: false,
      raw: true, // Keep raw values for better date detection
      dateNF: 'yyyy-mm-dd',
      cellStyles: false,
      cellHTML: false,
      sheetStubs: false
    });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Spreadsheet contains no valid sheets');
    }
    
    console.log('📊 Workbook loaded:', {
      sheets: workbook.SheetNames,
      totalSheets: workbook.SheetNames.length
    });
    
    // Check for 1904 date system (Mac Excel)
    const date1904 = workbook.Workbook?.WBProps?.date1904 || false;
    if (date1904) {
      console.log('📅 Detected 1904 date system (Mac Excel)');
    }
    
    setProgress?.({ 
      stage: 'analyzing', 
      progress: 40, 
      message: `🧠 Processing ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}` 
    });
    
    const allContracts: Partial<Contract>[] = [];
    const totalSheets = workbook.SheetNames.length;
    
    // Process each sheet with enhanced extraction
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      console.log(`🧠 Processing sheet ${i + 1}/${totalSheets}: "${sheetName}"`);
      
      const progressPercent = 40 + Math.round((i / totalSheets) * 45);
      setProgress?.({ 
        stage: 'extracting', 
        progress: progressPercent, 
        message: `🧠 Extracting sheet "${sheetName}" (${i + 1}/${totalSheets})...` 
      });
      
      try {
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet || !worksheet['!ref']) {
          console.log(`⚠️ Sheet "${sheetName}" empty or inaccessible`);
          continue;
        }
        
        // Convert to JSON with raw values for better date handling
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: null,
          raw: true, // Keep raw values - crucial for date detection
          dateNF: 'yyyy-mm-dd',
          blankrows: false
        }) as any[][];
        
        console.log(`📄 Sheet "${sheetName}" converted: ${jsonData.length} rows`);
        
        // Filter empty rows but keep headers
        const filteredData = jsonData.filter((row, index) => {
          if (index === 0) return true; // Keep headers
          return row && row.some(cell => 
            cell !== null && 
            cell !== undefined && 
            String(cell).trim() !== ''
          );
        });
        
        if (filteredData.length < 2) {
          console.log(`⚠️ Sheet "${sheetName}" has no useful data`);
          continue;
        }
        
        console.log(`🎯 Sheet "${sheetName}" prepared: ${filteredData.length} rows`);
        
        // Apply enhanced extraction with date system info
        const contractsFromSheet = extractContractFromSpreadsheetDataIntelligent(
          filteredData, 
          sheetName, 
          file.name,
          { date1904 }
        );
        
        if (contractsFromSheet.length > 0) {
          console.log(`✅ Extracted ${contractsFromSheet.length} contract(s) from sheet "${sheetName}"`);
          allContracts.push(...contractsFromSheet);
        } else {
          console.log(`⚠️ No contracts identified in sheet "${sheetName}"`);
        }
        
      } catch (sheetError) {
        console.error(`❌ Error in sheet "${sheetName}":`, sheetError);
      }
    }
    
    setProgress?.({ stage: 'finalizing', progress: 90, message: '🎯 Finalizing...' });
    
    console.log(`🏁 ENHANCED PROCESSING COMPLETE: ${allContracts.length} contracts`);
    
    // Create sample if no contracts found
    if (allContracts.length === 0) {
      console.log('🔄 Creating sample...');
      
      const sampleContract: Partial<Contract> = {
        numero: `SAMPLE-${new Date().getFullYear()}-001`,
        objeto: `Analysis of spreadsheet "${file.name}": No contracts were automatically identified. ` +
               `Please verify that headers are in Portuguese/English and data is in tabular format.`,
        contratante: 'Public Agency (review spreadsheet)',
        contratada: 'Contracted Company (review spreadsheet)',
        valor: 0,
        dataInicio: '',
        dataTermino: '',
        prazoExecucao: 0,
        prazoUnidade: 'dias',
        modalidade: 'pregao',
        status: 'vigente',
        observacoes: `File "${file.name}" processed. ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}. ` +
                    `System could not automatically identify contracts. ` +
                    `Please check if data is in tabular format with appropriate headers. ` +
                    `Date system: ${date1904 ? '1904 (Mac)' : '1900 (Windows)'}.`,
        aditivos: [],
        pagamentos: [],
        documentos: []
      };
      
      allContracts.push(sampleContract);
    }
    
    setProgress?.({ 
      stage: 'complete', 
      progress: 100, 
      message: `✅ Enhanced processing complete! ${allContracts.length} contract(s)` 
    });
    
    console.log('📋 ENHANCED PROCESSING REPORT:', {
      file: file.name,
      sheets: workbook.SheetNames.length,
      contracts: allContracts.length,
      date1904: date1904
    });
    
    // Delay to show result
    setTimeout(() => {
      setPreview(allContracts);
      setImporting(false);
    }, 1000);
    
  } catch (err) {
    console.error('❌ Enhanced processing error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    setError(`Failed to process "${file.name}": ${errorMessage}. ` +
            `Please check if the file is not corrupted or password protected. ` +
            `Supported formats: .xlsx, .xls, .csv, .ods.`);
    
    setProgress?.({ stage: 'error', progress: 0, message: `❌ Error: ${errorMessage}` });
    setImporting(false);
  }
};
