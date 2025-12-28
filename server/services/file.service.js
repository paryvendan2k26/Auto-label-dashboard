const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

/**
 * File Service
 * Handles parsing of CSV and JSON files
 */
class FileService {
  
  /**
   * Parse CSV file and return array of objects
   */
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          // Clean up keys (trim whitespace)
          const cleanData = {};
          Object.keys(data).forEach(key => {
            cleanData[key.trim()] = data[key];
          });
          results.push(cleanData);
        })
        .on('end', () => {
          console.log(`✅ Parsed ${results.length} rows from CSV`);
          resolve(results);
        })
        .on('error', (error) => {
          console.error('❌ CSV parsing error:', error);
          reject(new Error('Failed to parse CSV file'));
        });
    });
  }
  
  /**
   * Parse JSON file and return array of objects
   * Supports:
   * - Array of objects: [{...}, {...}]
   * - Object with array property: {data: [{...}, {...}]}
   * - JSONL format: one JSON object per line
   */
  async parseJSON(filePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Check file stats
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('JSON file is empty');
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8').trim();
      
      if (!fileContent) {
        throw new Error('JSON file is empty');
      }
      
      let data;
      
      // Try parsing as regular JSON first
      try {
        data = JSON.parse(fileContent);
      } catch (parseError) {
        // If standard JSON parsing fails, try JSONL format (JSON Lines)
        console.log('📝 Attempting JSONL format parsing...');
        const lines = fileContent.split('\n').filter(line => line.trim());
        data = lines.map((line, index) => {
          try {
            return JSON.parse(line);
          } catch (lineError) {
            throw new Error(`Invalid JSON at line ${index + 1}: ${lineError.message}`);
          }
        });
      }
      
      // Handle different JSON structures
      let items = [];
      
      if (Array.isArray(data)) {
        items = data;
      } else if (typeof data === 'object' && data !== null) {
        // Check if it's an object with an array property
        const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayKeys.length > 0) {
          // Use the first array property found
          items = data[arrayKeys[0]];
          console.log(`📝 Found array in property: ${arrayKeys[0]}`);
        } else {
          // Single object - wrap it in an array
          items = [data];
          console.log('📝 Single object wrapped in array');
        }
      } else {
        throw new Error('JSON file must contain an object or array of objects');
      }
      
      // Validate items
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('JSON file must contain at least one data item');
      }
      
      // Ensure all items are objects
      const invalidItems = items.filter(item => typeof item !== 'object' || item === null);
      if (invalidItems.length > 0) {
        throw new Error(`Found ${invalidItems.length} invalid items (must be objects)`);
      }
      
      console.log(`✅ Parsed ${items.length} items from JSON`);
      return items;
      
    } catch (error) {
      console.error('❌ JSON parsing error:', error);
      console.error('❌ File path:', filePath);
      throw new Error('Failed to parse JSON file: ' + error.message);
    }
  }
  
  /**
   * Validate file type
   */
  validateFile(file) {
    const allowedExtensions = ['.csv', '.json'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }
    
    return true;
  }
  
  /**
   * Validate parsed data structure
   */
  validateData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('File must contain at least one data row');
    }
    
    // Check if all items are objects
    const allObjects = data.every(item => typeof item === 'object' && item !== null);
    if (!allObjects) {
      throw new Error('All data items must be objects');
    }
    
    // Check if there's at least one field with text
    const firstItem = data[0];
    const hasTextField = Object.values(firstItem).some(value => 
      typeof value === 'string' && value.trim().length > 0
    );
    
    if (!hasTextField) {
      throw new Error('Data must contain at least one text field');
    }
    
    return true;
  }
  
  /**
   * Delete uploaded file after processing
   */
  deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted temporary file: ${filePath}`);
      }
    } catch (error) {
      console.error('Warning: Could not delete file:', error.message);
    }
  }
  
  /**
   * Extract text from data item (find the main text field)
   */
  extractText(dataItem) {
    // Common field names for text content
    const textFields = ['text', 'content', 'review', 'comment', 'description', 'message', 'body'];
    
    // Try to find a text field
    for (const field of textFields) {
      if (dataItem[field]) {
        return dataItem[field];
      }
    }
    
    // If no common field found, return first non-empty string value
    for (const [key, value] of Object.entries(dataItem)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
    
    // Last resort: stringify the whole object
    return JSON.stringify(dataItem);
  }
}

module.exports = new FileService();