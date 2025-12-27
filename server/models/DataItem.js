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
  
  aiReasoning: {
    type: String,
    default: null,
    trim: true
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
  
  // Human Review
  humanLabel: {
    type: String,
    default: null,
    trim: true
  },
  
  reviewAction: {
    type: String,
    enum: ['accepted', 'modified', 'skipped'],
    default: null
  },
  
  reviewedBy: {
    type: String,
    default: null
  },
  
  reviewedAt: {
    type: Date,
    default: null
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

// Index for finding unreviewed items
dataItemSchema.index({ 
  datasetId: 1, 
  humanLabel: 1 
});

// Index for finding unlabeled items
dataItemSchema.index({ 
  datasetId: 1, 
  aiLabel: 1 
});

// Instance method to accept AI label
dataItemSchema.methods.acceptLabel = async function(reviewedBy = 'user') {
  this.humanLabel = this.aiLabel;
  this.reviewAction = 'accepted';
  this.reviewedBy = reviewedBy;
  this.reviewedAt = Date.now();
  this.reviewStatus = 'reviewed';
  await this.save();
};

// Instance method to modify label
dataItemSchema.methods.modifyLabel = async function(newLabel, reviewedBy = 'user') {
  this.humanLabel = newLabel;
  this.reviewAction = 'modified';
  this.reviewedBy = reviewedBy;
  this.reviewedAt = Date.now();
  this.reviewStatus = 'reviewed';
  await this.save();
};

// Static method to get queue summary
dataItemSchema.statics.getQueueSummary = async function(datasetId) {
  const summary = await this.aggregate([
    { $match: { datasetId: mongoose.Types.ObjectId(datasetId) } },
    { 
      $group: {
        _id: '$reviewStatus',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$aiConfidence' }
      }
    }
  ]);
  
  const reviewed = await this.countDocuments({
    datasetId: mongoose.Types.ObjectId(datasetId),
    humanLabel: { $ne: null }
  });
  
  // Format response
  const result = {
    pending: 0,
    auto_accepted: 0,
    needs_review: 0,
    low_confidence: 0,
    reviewed: reviewed
  };
  
  summary.forEach(item => {
    result[item._id] = item.count;
  });
  
  result.total = Object.values(result).reduce((a, b) => a + b, 0) - reviewed;
  result.pendingReview = result.needs_review + result.low_confidence - reviewed;
  
  return result;
};

const DataItem = mongoose.model('DataItem', dataItemSchema);

module.exports = DataItem;