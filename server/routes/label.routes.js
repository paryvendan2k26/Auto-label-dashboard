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
    
    // Build query - only items that need review
    const query = {
      datasetId: datasetObjectId,
      reviewStatus: { $in: ['needs_review', 'low_confidence'] },
      humanLabel: null
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
 * @desc    Accept or modify a label
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, newLabel, reviewedBy = 'user' } = req.body;
    
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
      await item.acceptLabel(reviewedBy);
      console.log(`✅ Label accepted for item ${id}`);
    } else if (action === 'modify') {
      if (!newLabel) {
        return res.status(400).json({
          success: false,
          error: 'newLabel is required for modify action'
        });
      }
      await item.modifyLabel(newLabel, reviewedBy);
      console.log(`✏️  Label modified for item ${id}: ${item.aiLabel} → ${newLabel}`);
    }
    
    res.json({
      success: true,
      message: `Label ${action}ed successfully`,
      data: {
        itemId: item._id,
        aiLabel: item.aiLabel,
        humanLabel: item.humanLabel,
        reviewAction: item.reviewAction,
        reviewedAt: item.reviewedAt
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
 * @desc    Accept multiple labels at once
 * @access  Public
 */
router.post('/batch-accept', async (req, res) => {
  try {
    const { itemIds, reviewedBy = 'user' } = req.body;
    
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'itemIds array is required'
      });
    }
    
    // Get all items first
    const items = await DataItem.find({ _id: { $in: itemIds } });
    
    // Update each item to copy aiLabel to humanLabel
    const updates = items.map(item => {
      item.humanLabel = item.aiLabel;
      item.reviewAction = 'accepted';
      item.reviewedBy = reviewedBy;
      item.reviewedAt = new Date();
      item.reviewStatus = 'reviewed';
      return item.save();
    });
    
    await Promise.all(updates);
    
    console.log(`✅ Batch accepted ${items.length} items`);
    
    res.json({
      success: true,
      message: `${items.length} items accepted`,
      data: {
        acceptedCount: items.length
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