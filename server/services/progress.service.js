const { Dataset, DataItem } = require('../models');

/**
 * Progress Service
 * Calculate and track labeling progress
 */
class ProgressService {
  
  /**
   * Calculate current progress for a dataset
   * Includes speed (items/min) and ETA
   */
  async calculateProgress(datasetId) {
    try {
      const dataset = await Dataset.findById(datasetId);
      const total = await DataItem.countDocuments({ datasetId });
      const labeled = await DataItem.countDocuments({ 
        datasetId, 
        aiLabel: { $ne: null } 
      });
      
      const percentage = total > 0 ? Math.round((labeled / total) * 100) : 0;
      const remaining = total - labeled;
      
      // Calculate speed and ETA
      let speed = 0; // items per minute
      let eta = null; // estimated time remaining in seconds
      
      if (labeled > 0 && dataset) {
        // Get the earliest labeled item timestamp
        const firstLabeled = await DataItem.findOne({
          datasetId,
          aiLabel: { $ne: null }
        }).sort({ labeledAt: 1 });
        
        if (firstLabeled && firstLabeled.labeledAt) {
          const elapsedSeconds = (Date.now() - firstLabeled.labeledAt.getTime()) / 1000;
          const elapsedMinutes = elapsedSeconds / 60;
          
          if (elapsedMinutes > 0) {
            speed = Math.round(labeled / elapsedMinutes);
            
            // Calculate ETA if there are remaining items
            if (remaining > 0 && speed > 0) {
              const remainingMinutes = remaining / speed;
              eta = Math.round(remainingMinutes * 60); // ETA in seconds
            }
          }
        }
      }
      
      return {
        total,
        labeled,
        remaining,
        percentage,
        status: percentage === 100 ? 'completed' : 'in_progress',
        speed, // items per minute
        eta // estimated seconds remaining
      };
      
    } catch (error) {
      console.error('❌ Error calculating progress:', error);
      throw error;
    }
  }
  
  /**
   * Update dataset with current progress
   */
  async updateProgress(datasetId) {
    try {
      const progress = await this.calculateProgress(datasetId);
      
      // Update dataset status
      const dataset = await Dataset.findById(datasetId);
      if (dataset) {
        if (progress.percentage === 100) {
          dataset.status = 'completed';
          dataset.completedAt = new Date();
        } else if (progress.labeled > 0) {
          dataset.status = 'labeling';
        }
        await dataset.save();
        await dataset.updateStats();
      }
      
      return progress;
      
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      throw error;
    }
  }
  
  /**
   * Get detailed statistics for a dataset
   */
  async getStatistics(datasetId) {
    try {
      const dataset = await Dataset.findById(datasetId);
      if (!dataset) {
        throw new Error('Dataset not found');
      }
      
      // Label distribution
      const labelDistribution = await DataItem.aggregate([
        { $match: { datasetId: dataset._id, aiLabel: { $ne: null } } },
        { $group: { _id: '$aiLabel', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      // Confidence distribution
      const confidenceRanges = await DataItem.aggregate([
        { $match: { datasetId: dataset._id, aiConfidence: { $ne: null } } },
        {
          $bucket: {
            groupBy: '$aiConfidence',
            boundaries: [0, 0.5, 0.7, 0.8, 0.9, 1.0],
            default: 'other',
            output: { count: { $sum: 1 } }
          }
        }
      ]);
      
      // Average confidence
      const avgConfidenceResult = await DataItem.aggregate([
        { $match: { datasetId: dataset._id, aiConfidence: { $ne: null } } },
        { $group: { _id: null, avgConfidence: { $avg: '$aiConfidence' } } }
      ]);
      
      const avgConfidence = avgConfidenceResult[0]?.avgConfidence || 0;
      
      // Progress
      const progress = await this.calculateProgress(datasetId);
      
      // Format confidence ranges properly
      const boundaries = [0, 0.5, 0.7, 0.8, 0.9, 1.0];
      const formattedConfidenceRanges = confidenceRanges.map(range => {
        const lowerBound = range._id;
        const upperBoundIndex = boundaries.indexOf(lowerBound) + 1;
        const upperBound = boundaries[upperBoundIndex] || 1.0;
        
        return {
          range: `${lowerBound.toFixed(1)}-${upperBound.toFixed(1)}`,
          count: range.count
        };
      });
      
      return {
        dataset: {
          id: dataset._id,
          name: dataset.name,
          status: dataset.status,
          itemCount: dataset.itemCount,
          createdAt: dataset.createdAt,
          completedAt: dataset.completedAt
        },
        progress,
        stats: dataset.stats,
        labelDistribution: labelDistribution.map(item => ({
          label: item._id,
          count: item.count,
          percentage: progress.labeled > 0 ? Math.round((item.count / progress.labeled) * 100) : 0
        })),
        confidenceDistribution: formattedConfidenceRanges,
        avgConfidence: Math.round(avgConfidence * 100) / 100
      };
      
    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      throw error;
    }
  }
}

module.exports = new ProgressService();