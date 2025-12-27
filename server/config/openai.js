const OpenAI = require('openai');

/**
 * OpenAI Configuration
 */

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configuration constants
const OPENAI_CONFIG = {
  MODEL: 'gpt-4o-mini',           // Fast and cost-effective
  TEMPERATURE: 0.3,                // Low for consistent labeling
  MAX_TOKENS: 4000,                // Response limit
  
  // Batch sizing strategy
  SINGLE_REQUEST_THRESHOLD: 100,   // < 100 items: send all at once
  SEQUENTIAL_THRESHOLD: 2000,      // 100-2000: sequential batches
  SEQUENTIAL_BATCH_SIZE: 50,       // Items per sequential batch
  PARALLEL_BATCH_SIZE: 20,         // Items per parallel batch
  PARALLEL_CONCURRENT: 10          // Number of parallel requests
};

module.exports = { openai, OPENAI_CONFIG };