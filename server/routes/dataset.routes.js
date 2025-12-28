const express = require('express');
const router = express.Router();
const path = require('path');
const upload = require('../middleware/upload');
const fileService = require('../services/file.service');
const { Dataset, DataItem } = require('../models');

/**
 * @route   POST /api/datasets/upload
 * @desc    Upload CSV or JSON file and create dataset
 * @access  Public
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  let filePath = null;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase().slice(1); // Remove dot
    
    console.log(`📤 Uploading file: ${req.file.originalname} (${fileType})`);
    console.log(`📁 File path: ${filePath}`);
    console.log(`📊 File size: ${req.file.size} bytes`);
    
    // Parse file based on type
    let parsedData;
    try {
      if (fileType === 'csv') {
        parsedData = await fileService.parseCSV(filePath);
      } else if (fileType === 'json') {
        parsedData = await fileService.parseJSON(filePath);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (parseError) {
      console.error('❌ File parsing error:', parseError);
      console.error('❌ Parse error stack:', parseError.stack);
      throw new Error(`Failed to parse ${fileType.toUpperCase()} file: ${parseError.message}`);
    }
    
    // Validate parsed data
    fileService.validateData(parsedData);
    
    // Create dataset in database
    const dataset = new Dataset({
      name: req.file.originalname,
      fileName: req.file.originalname,
      fileType: fileType,
      itemCount: parsedData.length,
      status: 'uploaded'
    });
    
    await dataset.save();
    console.log(`✅ Dataset created: ${dataset._id}`);
    
    // Create data items (batch insert for performance)
    const dataItems = parsedData.map(item => ({
      datasetId: dataset._id,
      originalData: item,
      reviewStatus: 'pending'
    }));
    
    await DataItem.insertMany(dataItems);
    console.log(`✅ Inserted ${dataItems.length} data items`);
    
    // Update dataset stats
    await dataset.updateStats();
    
    // Delete temporary file
    fileService.deleteFile(filePath);
    
    // Send response
    res.status(201).json({
      success: true,
      message: 'File uploaded and processed successfully',
      data: {
        datasetId: dataset._id,
        name: dataset.name,
        fileType: dataset.fileType,
        itemCount: dataset.itemCount,
        status: dataset.status,
        createdAt: dataset.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Delete file if it exists
    if (filePath) {
      fileService.deleteFile(filePath);
    }
    
    // Pass error to error handler middleware
    res.status(500).json({
  success: false,
  error: error.message || 'File upload failed'
});
  }
});

/**
 * @route   GET /api/datasets
 * @desc    Get all datasets
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const datasets = await Dataset.find()
      .sort({ createdAt: -1 }) // Most recent first
      .select('-__v'); // Exclude version key
    
    res.json({
      success: true,
      count: datasets.length,
      data: datasets
    });
    
  } catch (error) {
    console.error('❌ Error fetching datasets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/datasets/:id
 * @desc    Get single dataset by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: 'Dataset not found'
      });
    }
    
    res.json({
      success: true,
      data: dataset
    });
    
  } catch (error) {
    console.error('❌ Error fetching dataset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/datasets/:id/configure
 * @desc    Add labeling schema to dataset
 * @access  Public
 */
router.post('/:id/configure', async (req, res) => {
  try {
    const { labelingSchema, labelType } = req.body;
    
    // Validate schema
    if (!labelingSchema || labelingSchema.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Labeling schema must be at least 20 characters'
      });
    }
    
    // Update dataset
    const dataset = await Dataset.findByIdAndUpdate(
      req.params.id,
      {
        labelingSchema: labelingSchema.trim(),
        labelType: labelType || 'classification',
        status: 'configured'
      },
      { new: true } // Return updated document
    );
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: 'Dataset not found'
      });
    }
    
    console.log(`✅ Dataset ${dataset._id} configured with schema`);
    
    res.json({
      success: true,
      message: 'Dataset configured successfully',
      data: dataset
    });
    
  } catch (error) {
    console.error('❌ Error configuring dataset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/datasets/:id
 * @desc    Delete dataset and all its items
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: 'Dataset not found'
      });
    }
    
    // Delete all data items
    await DataItem.deleteMany({ datasetId: req.params.id });
    
    // Delete dataset
    await Dataset.deleteOne({ _id: req.params.id });
    
    console.log(`🗑️  Deleted dataset ${req.params.id} and all its items`);
    
    res.json({
      success: true,
      message: 'Dataset deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting dataset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;