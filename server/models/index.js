/**
 * Central export for all models
 * Makes imports cleaner: require('./models')
 */

const Dataset = require('./Dataset');
const DataItem = require('./DataItem');

module.exports = {
  Dataset,
  DataItem
};