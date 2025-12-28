const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const labelingService = require('../services/labeling.service');
const { Dataset, DataItem } = require('../models');

/**
 * @route   POST /api/labels/dataset/:id/label
 * @desc    Start AI labeling for a dataset
 * @access  Public
 */
router.post('/dataset/:id/label', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if dataset exists
    const dataset = await Dataset.findById(id);
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: 'Dataset not found'
      });
    }
    
    // Check if schema is configured
    if (!dataset.labelingSchema) {
      return res.status(400).json({
        success: false,
        error: 'Please configure labeling schema first'
      });
    }
    
    // Check if already labeling
    if (dataset.status === 'labeling') {
      return res.status(400).json({
        success: false,
        error: 'Labeling already in progress'
      });
    }
    
    console.log(`\n🚀 Starting labeling for dataset: ${dataset.name}`);
    
    // Start labeling asynchronously (don't wait for completion)
    labelingService.labelDataset(id)
      .then(result => {
        console.log(`✅ Labeling completed for dataset ${id}:`, result);
      })
      .catch(error => {
        console.error(`❌ Labeling failed for dataset ${id}:`, error);
      });
    
    // Immediately respond to client
    res.json({
      success: true,
      message: 'Labeling started successfully',
      data: {
        datasetId: id,
        status: 'labeling',
        itemCount: dataset.itemCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error starting labeling:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/labels/dataset/:id/review-queue
 * @desc    Get items for review (Smart Queue with Backend Sorting)
 * @access  Public
 */
router.get('/dataset/:id/review-queue', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      sort = 'confidence'
    } = req.query;
    
    // Convert datasetId properly
    let datasetObjectId;
    if (typeof id === 'string') {
      datasetObjectId = new mongoose.Types.ObjectId(id);
    } else {
      datasetObjectId = id;
    }
    
    // Build query - only items that need review (not yet reviewed)
    const query = {
      datasetId: datasetObjectId,
      reviewStatus: { $in: ['needs_review', 'low_confidence'] }
    };
    
    // Determine sort order
    let sortOption = {};
    let items;
    
    switch (sort) {
      case 'confidence':
        sortOption = { aiConfidence: 1 };
        items = await DataItem.find(query)
          .sort(sortOption)
          .skip((page - 1) * limit)
          .limit(parseInt(limit));
        break;
        
      case 'recent':
        sortOption = { labeledAt: -1 };
        items = await DataItem.find(query)
          .sort(sortOption)
          .skip((page - 1) * limit)
          .limit(parseInt(limit));
        break;
        
      case 'random':
        items = await DataItem.aggregate([
          { $match: query },
          { $sample: { size: parseInt(limit) } }
        ]);
        break;
        
      default:
        sortOption = { aiConfidence: 1 };
        items = await DataItem.find(query)
          .sort(sortOption)
          .skip((page - 1) * limit)
          .limit(parseInt(limit));
    }
    
    // Get total count for pagination
    const totalCount = await DataItem.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        items: items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasMore: page * limit < totalCount
        },
        sorting: sort
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting review queue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
/**
 * @route   PUT /api/labels/:id
 * @desc    Accept or modify a label (directly overwrites aiLabel)
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, newLabel } = req.body;
    
    // Validate action
    if (!action || !['accept', 'modify'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "accept" or "modify"'
      });
    }
    
    // Get data item
    const item = await DataItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    // Perform action
    if (action === 'accept') {
      await item.acceptLabel();
      console.log(`✅ Label accepted for item ${id}`);
    } else if (action === 'modify') {
      if (!newLabel) {
        return res.status(400).json({
          success: false,
          error: 'newLabel is required for modify action'
        });
      }
      await item.modifyLabel(newLabel);
      console.log(`✏️  Label modified for item ${id}: ${newLabel}`);
    }
    
    // Refresh item to get updated data
    const updatedItem = await DataItem.findById(id);
    
    res.json({
      success: true,
      message: `Label ${action}ed successfully`,
      data: {
        itemId: updatedItem._id,
        aiLabel: updatedItem.aiLabel,
        reviewStatus: updatedItem.reviewStatus
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating label:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/labels/batch-accept
 * @desc    Accept all items in review queue (mark as reviewed)
 * @access  Public
 */
router.post('/batch-accept', async (req, res) => {
  try {
    const { datasetId } = req.body;
    
    if (!datasetId) {
      return res.status(400).json({
        success: false,
        error: 'datasetId is required'
      });
    }
    
    // Update all items that need review to reviewed status
    const result = await DataItem.updateMany(
      { 
        datasetId: datasetId,
        reviewStatus: { $in: ['needs_review', 'low_confidence'] }
      },
      { 
        reviewStatus: 'reviewed'
      }
    );
    
    console.log(`✅ Batch accepted ${result.modifiedCount} items`);
    
    res.json({
      success: true,
      message: `${result.modifiedCount} items accepted`,
      data: {
        acceptedCount: result.modifiedCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error batch accepting:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;