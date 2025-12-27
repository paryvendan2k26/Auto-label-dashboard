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
   */
  async parseJSON(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error('JSON file must contain an array of objects');
      }
      
      console.log(`✅ Parsed ${data.length} items from JSON`);
      return data;
      
    } catch (error) {
      console.error('❌ JSON parsing error:', error);
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