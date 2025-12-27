const express = require('express');
const router = express.Router();
const progressService = require('../services/progress.service');
const { Dataset, DataItem } = require('../models');

/**
 * @route   GET /api/stats/dataset/:id/progress
 * @desc    Get real-time labeling progress
 * @access  Public
 */
router.get('/dataset/:id/progress', async (req, res) => {
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
    
    // Calculate progress
    const progress = await progressService.calculateProgress(id);
    
    res.json({
      success: true,
      data: {
        datasetId: id,
        datasetName: dataset.name,
        status: dataset.status,
        progress: progress,
        startedAt: dataset.createdAt,
        completedAt: dataset.completedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting progress:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/stats/dataset/:id/statistics
 * @desc    Get detailed statistics for a dataset
 * @access  Public
 */
router.get('/dataset/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    
    const statistics = await progressService.getStatistics(id);
    
    res.json({
      success: true,
      data: statistics
    });
    
  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/stats/dataset/:id/queue-summary
 * @desc    Get smart queue summary
 * @access  Public
 */
router.get('/dataset/:id/queue-summary', async (req, res) => {
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
    
    // Get queue summary using static method
    const summary = await DataItem.getQueueSummary(id);
    
    res.json({
      success: true,
      data: {
        datasetId: id,
        datasetName: dataset.name,
        summary: summary
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting queue summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/stats/dataset/:id/export
 * @desc    Export labeled dataset as CSV
 * @access  Public
 */
router.get('/dataset/:id/export', async (req, res) => {
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
    
    // Get all labeled items
    const items = await DataItem.find({ datasetId: id })
      .sort({ createdAt: 1 });
    
    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data to export'
      });
    }
    
    // Build CSV
    const csvRows = [];
    
    // Get all keys from first item's originalData
    const firstItem = items[0].originalData;
    const originalKeys = Object.keys(firstItem);
    
    // Header row
    const headers = [
      ...originalKeys,
      'ai_label',
      'ai_confidence',
      'ai_reasoning',
      'human_label',
      'review_status',
      'reviewed_at'
    ];
    csvRows.push(headers.join(','));
    
    // Data rows
    items.forEach(item => {
      const row = [];
      
      // Original data columns
      originalKeys.forEach(key => {
        const value = item.originalData[key] || '';
        // Escape commas and quotes
        const escaped = String(value).replace(/"/g, '""');
        row.push(`"${escaped}"`);
      });
      
      // Label columns
      row.push(`"${item.aiLabel || ''}"`);
      row.push(item.aiConfidence || '');
      row.push(`"${item.aiReasoning || ''}"`);
      row.push(`"${item.humanLabel || ''}"`);
      row.push(`"${item.reviewStatus || ''}"`);
      row.push(item.reviewedAt ? item.reviewedAt.toISOString() : '');
      
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${dataset.name}-labeled.csv"`);
    
    res.send(csvContent);
    
  } catch (error) {
    console.error('❌ Error exporting dataset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;