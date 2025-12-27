const mongoose = require('mongoose');

/**
 * Dataset Schema
 * Represents an uploaded dataset with labeling configuration
 */
const datasetSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Dataset name is required'],
    trim: true
  },
  
  fileName: {
    type: String,
    required: true
  },
  
  fileType: {
    type: String,
    enum: ['csv', 'json'],
    required: true
  },
  
  // Dataset Size
  itemCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Labeling Configuration
  labelingSchema: {
    type: String,
    default: null,
    trim: true
  },
  
  labelType: {
    type: String,
    enum: ['classification', 'sentiment', 'entity', 'custom'],
    default: 'classification'
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['uploaded', 'configured', 'labeling', 'completed', 'error'],
    default: 'uploaded'
  },
  
  // Quick Stats (for performance - avoid counting every time)
  stats: {
    totalItems: { type: Number, default: 0 },
    labeledItems: { type: Number, default: 0 },
    autoAcceptedItems: { type: Number, default: 0 },
    needsReviewItems: { type: Number, default: 0 },
    lowConfidenceItems: { type: Number, default: 0 },
    reviewedItems: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Error tracking
  errorMessage: {
    type: String,
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
  },
  
  completedAt: {
    type: Date,
    default: null
  }
});

// Update 'updatedAt' on every save
datasetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Instance method to update stats
datasetSchema.methods.updateStats = async function() {
  const DataItem = mongoose.model('DataItem');
  
  const total = await DataItem.countDocuments({ datasetId: this._id });
  const labeled = await DataItem.countDocuments({ 
    datasetId: this._id, 
    aiLabel: { $ne: null } 
  });
  
  const statusCounts = await DataItem.aggregate([
    { $match: { datasetId: this._id } },
    { $group: { _id: '$reviewStatus', count: { $sum: 1 } } }
  ]);
  
  const reviewed = await DataItem.countDocuments({
    datasetId: this._id,
    humanLabel: { $ne: null }
  });
  
  // Update stats object
  this.stats = {
    totalItems: total,
    labeledItems: labeled,
    autoAcceptedItems: statusCounts.find(s => s._id === 'auto_accepted')?.count || 0,
    needsReviewItems: statusCounts.find(s => s._id === 'needs_review')?.count || 0,
    lowConfidenceItems: statusCounts.find(s => s._id === 'low_confidence')?.count || 0,
    reviewedItems: reviewed,
    lastUpdated: Date.now()
  };
  
  await this.save();
};

// Create indexes for faster queries
datasetSchema.index({ createdAt: -1 });
datasetSchema.index({ status: 1 });

const Dataset = mongoose.model('Dataset', datasetSchema);

module.exports = Dataset;