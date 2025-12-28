const mongoose = require('mongoose');

/**
 * DataItem Schema
 * Represents individual items/rows in a dataset
 */
const dataItemSchema = new mongoose.Schema({
  // Reference to parent dataset
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    required: true,
    index: true
  },
  
  // Original data from CSV/JSON
  originalData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // AI Labeling Results
  aiLabel: {
    type: String,
    default: null,
    trim: true
  },
  
  aiConfidence: {
    type: Number,
    default: null,
    min: 0,
    max: 1
  },
  
  labeledAt: {
    type: Date,
    default: null
  },
  
  // Review Status (for smart queue)
  reviewStatus: {
    type: String,
    enum: ['pending', 'auto_accepted', 'needs_review', 'low_confidence', 'reviewed'],
    default: 'pending'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update 'updatedAt' on every save
dataItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Compound indexes for smart queue queries (CRITICAL for performance)
dataItemSchema.index({ 
  datasetId: 1, 
  reviewStatus: 1, 
  aiConfidence: 1 
});

// Index for finding unlabeled items
dataItemSchema.index({ 
  datasetId: 1, 
  aiLabel: 1 
});

// Instance method to accept AI label (mark as reviewed, keep aiLabel)
dataItemSchema.methods.acceptLabel = async function() {
  this.reviewStatus = 'reviewed';
  await this.save();
};

// Instance method to modify label (directly update aiLabel)
dataItemSchema.methods.modifyLabel = async function(newLabel) {
  this.aiLabel = newLabel;
  this.reviewStatus = 'reviewed';
  await this.save();
};

// Static method to get queue summary
// Static method to get queue summary
dataItemSchema.statics.getQueueSummary = async function(datasetId) {
  try {
    const mongoose = require('mongoose');
    
    // Convert string to ObjectId properly
    let objectId;
    if (typeof datasetId === 'string') {
      objectId = new mongoose.Types.ObjectId(datasetId);
    } else {
      objectId = datasetId;
    }
    
    // Get all items grouped by review status
    const summary = await this.aggregate([
      { $match: { datasetId: objectId } },
      { 
        $group: {
          _id: '$reviewStatus',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$aiConfidence' }
        }
      }
    ]);
    
    // Count reviewed items (items with reviewStatus = 'reviewed')
    const reviewed = await this.countDocuments({
      datasetId: objectId,
      reviewStatus: 'reviewed'
    });
    
    // Format response with default values
    const result = {
      pending: 0,
      auto_accepted: 0,
      needs_review: 0,
      low_confidence: 0,
      reviewed: reviewed
    };
    
    // Map aggregation results to result object
    summary.forEach(item => {
      if (item._id) {
        result[item._id] = item.count;
      }
    });
    
    // Calculate totals
    result.total = result.pending + result.auto_accepted + result.needs_review + result.low_confidence;
    result.pendingReview = Math.max(0, result.needs_review + result.low_confidence - reviewed);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in getQueueSummary:', error);
    throw error;
  }
};


const DataItem = mongoose.model('DataItem', dataItemSchema);

module.exports = DataItem;