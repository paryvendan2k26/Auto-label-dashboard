/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString();
};

/**
 * Format percentage
 */
export const formatPercent = (num) => {
  if (num === null || num === undefined) return '0%';
  return `${Math.round(num)}%`;
};

/**
 * Format confidence score
 */
export const formatConfidence = (score) => {
  if (score === null || score === undefined) return 'N/A';
  return `${Math.round(score * 100)}%`;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format duration (seconds to readable string)
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Get status color for Ant Design
 */
export const getStatusColor = (status) => {
  const colors = {
    uploaded: 'blue',
    configured: 'cyan',
    labeling: 'orange',
    completed: 'green',
    error: 'red',
  };
  return colors[status] || 'default';
};

/**
 * Get review status color
 */
export const getReviewStatusColor = (status) => {
  const colors = {
    auto_accepted: 'green',
    needs_review: 'orange',
    low_confidence: 'red',
    reviewed: 'blue',
    pending: 'gray',
  };
  return colors[status] || 'default';
};