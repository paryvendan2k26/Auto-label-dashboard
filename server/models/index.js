/**
 * Central export for all models
 * Makes imports cleaner: require('./models')
 */

const Dataset = require('./Dataset');
const DataItem = require('./DataItem');
const User = require('./User');

module.exports = {
  Dataset,
  DataItem,
  User
};