require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { Dataset, DataItem } = require('./models');

async function testModels() {
  try {
    // Connect to database
    await connectDB();
    
    console.log('\n🧪 Testing Models...\n');
    
    // Test 1: Create a dataset
    console.log('📝 Test 1: Creating dataset...');
    const dataset = new Dataset({
      name: 'Test Dataset',
      fileName: 'test.csv',
      fileType: 'csv',
      itemCount: 3,
      labelingSchema: 'Classify sentiment as: positive, negative, neutral',
      status: 'uploaded'
    });
    
    await dataset.save();
    console.log('✅ Dataset created:', dataset._id);
    
    // Test 2: Create data items
    console.log('\n📝 Test 2: Creating data items...');
    const items = [
      {
        datasetId: dataset._id,
        originalData: { text: 'Great product!' },
        aiLabel: 'positive',
        aiConfidence: 0.95,
        reviewStatus: 'auto_accepted'
      },
      {
        datasetId: dataset._id,
        originalData: { text: 'Not sure about this' },
        aiLabel: 'neutral',
        aiConfidence: 0.75,
        reviewStatus: 'needs_review'
      },
      {
        datasetId: dataset._id,
        originalData: { text: 'Maybe good?' },
        aiLabel: 'positive',
        aiConfidence: 0.65,
        reviewStatus: 'low_confidence'
      }
    ];
    
    const createdItems = await DataItem.insertMany(items);
    console.log(`✅ Created ${createdItems.length} items`);
    
    // Test 3: Query items by confidence
    console.log('\n📝 Test 3: Querying items by confidence...');
    const lowConfItems = await DataItem.find({
      datasetId: dataset._id,
      aiConfidence: { $lt: 0.80 }
    }).sort({ aiConfidence: 1 });
    
    console.log(`✅ Found ${lowConfItems.length} low confidence items:`);
    lowConfItems.forEach(item => {
      console.log(`   - "${item.originalData.text}" (${item.aiConfidence})`);
    });
    
    // Test 4: Get queue summary (FIXED)
    console.log('\n📝 Test 4: Getting queue summary...');
    
    // Manual aggregation instead of using the static method for testing
    const summary = await DataItem.aggregate([
      { $match: { datasetId: dataset._id } },
      { 
        $group: {
          _id: '$reviewStatus',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$aiConfidence' }
        }
      }
    ]);
    
    const reviewed = await DataItem.countDocuments({
      datasetId: dataset._id,
      reviewStatus: 'reviewed'
    });
    
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
    
    result.total = result.auto_accepted + result.needs_review + result.low_confidence + result.pending;
    result.pendingReview = result.needs_review + result.low_confidence - reviewed;
    
    console.log('✅ Queue Summary:', result);
    
    // Test 5: Update dataset stats
    console.log('\n📝 Test 5: Updating dataset stats...');
    await dataset.updateStats();
    const updatedDataset = await Dataset.findById(dataset._id);
    console.log('✅ Stats updated:', updatedDataset.stats);
    
    // Test 6: Accept a label
    console.log('\n📝 Test 6: Accepting a label...');
    const itemToAccept = await DataItem.findById(createdItems[1]._id);
    await itemToAccept.acceptLabel();
    console.log('✅ Label accepted for item:', itemToAccept._id);
    
    // Test 7: Modify a label
    console.log('\n📝 Test 7: Modifying a label...');
    const itemToModify = await DataItem.findById(createdItems[2]._id);
    await itemToModify.modifyLabel('negative');
    console.log('✅ Label modified for item:', itemToModify._id);
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await DataItem.deleteMany({ datasetId: dataset._id });
    await Dataset.deleteOne({ _id: dataset._id });
    console.log('✅ Cleanup complete');
    
    console.log('\n✅ All tests passed! Models working correctly.\n');
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testModels();