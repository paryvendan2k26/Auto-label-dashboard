const { openai, OPENAI_CONFIG } = require('../config/openai');
const { Dataset, DataItem } = require('../models');
const progressService = require('./progress.service');
const fileService = require('./file.service');

/**
 * Labeling Service with Adaptive Batching
 * Automatically chooses best strategy based on dataset size
 */
class LabelingService {
  
  /**
   * Main entry point - Label entire dataset
   */
  async labelDataset(datasetId) {
    const startTime = Date.now();
    
    try {
      console.log('\n🤖 Starting AI Labeling Process...');
      
      // Get dataset
      const dataset = await Dataset.findById(datasetId);
      if (!dataset) {
        throw new Error('Dataset not found');
      }
      
      if (!dataset.labelingSchema) {
        throw new Error('Labeling schema not configured');
      }
      
      // Update status
      dataset.status = 'labeling';
      await dataset.save();
      
      // Get unlabeled items
      const items = await DataItem.find({ 
        datasetId, 
        aiLabel: null 
      });
      
      const itemCount = items.length;
      const schema = dataset.labelingSchema;
      
      console.log(`📊 Dataset: ${dataset.name}`);
      console.log(`📝 Items to label: ${itemCount}`);
      console.log(`🎯 Schema: ${schema.substring(0, 60)}...`);
      
      // ADAPTIVE STRATEGY SELECTION
      let results;
      let strategy;
      
      if (itemCount <= OPENAI_CONFIG.SINGLE_REQUEST_THRESHOLD) {
        // Strategy 1: Single Request (< 100 items)
        strategy = 'SINGLE_REQUEST';
        console.log(`\n✅ Strategy: ${strategy} (all at once)`);
        results = await this.labelAllAtOnce(items, schema);
        
      } else if (itemCount <= OPENAI_CONFIG.SEQUENTIAL_THRESHOLD) {
        // Strategy 2: Sequential Batches (100-2000 items)
        strategy = 'SEQUENTIAL_BATCHES';
        console.log(`\n✅ Strategy: ${strategy} (one by one)`);
        results = await this.labelSequential(items, schema, datasetId);
        
      } else {
        // Strategy 3: Parallel Batches (> 2000 items)
        strategy = 'PARALLEL_BATCHES';
        console.log(`\n✅ Strategy: ${strategy} (10x concurrent)`);
        results = await this.labelParallel(items, schema, datasetId);
      }
      
      // Update final progress
      await progressService.updateProgress(datasetId);
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      console.log(`\n✅ Labeling Complete!`);
      console.log(`⏱️  Time taken: ${duration}s`);
      console.log(`📊 Items labeled: ${results.length}`);
      console.log(`⚡ Speed: ${Math.round(results.length / duration)} items/sec`);
      
      return {
        success: true,
        itemsLabeled: results.length,
        strategy: strategy,
        duration: duration,
        speed: Math.round(results.length / duration)
      };
      
    } catch (error) {
      console.error('❌ Labeling failed:', error);
      
      // Update dataset status to error
      await Dataset.findByIdAndUpdate(datasetId, { 
        status: 'error',
        errorMessage: error.message 
      });
      
      throw error;
    }
  }
  
  /**
   * Strategy 1: Single Request (< 100 items)
   */
  async labelAllAtOnce(items, schema) {
    console.log(`📦 Sending ${items.length} items in single request...`);
    
    const itemsText = items.map((item, idx) => 
      `${idx + 1}. "${fileService.extractText(item.originalData)}"`
    ).join('\n');
    
    const prompt = this.buildPrompt(schema, itemsText);
    
    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: [
          { 
            role: "system", 
            content: "You are a data labeling assistant. Always respond with valid JSON only. No markdown, no explanations." 
          },
          { role: "user", content: prompt }
        ],
        temperature: OPENAI_CONFIG.TEMPERATURE,
        max_tokens: OPENAI_CONFIG.MAX_TOKENS
      });
      
      const labels = this.parseLabels(response.choices[0].message.content);
      await this.saveLabels(items, labels);
      
      console.log(`✅ Labeled ${labels.length} items`);
      
      return labels;
      
    } catch (error) {
      console.error('❌ Single request failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Strategy 2: Sequential Batches (100-2000 items)
   */
  async labelSequential(items, schema, datasetId) {
    const batchSize = OPENAI_CONFIG.SEQUENTIAL_BATCH_SIZE;
    const batches = this.chunkArray(items, batchSize);
    const allResults = [];
    
    console.log(`📦 Processing ${batches.length} batches sequentially...`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        console.log(`  Batch ${i + 1}/${batches.length} (${batch.length} items)...`);
        
        const labels = await this.labelBatch(batch, schema);
        allResults.push(...labels);
        
        // Update progress after each batch
        if (i % 5 === 0 || i === batches.length - 1) {
          await progressService.updateProgress(datasetId);
        }
        
        console.log(`  ✓ Batch ${i + 1} completed`);
        
      } catch (error) {
        console.error(`  ✗ Batch ${i + 1} failed:`, error.message);
        // Continue with next batch
      }
    }
    
    return allResults;
  }
  
  /**
   * Strategy 3: Parallel Batches (> 2000 items)
   */
  async labelParallel(items, schema, datasetId) {
    const batchSize = OPENAI_CONFIG.PARALLEL_BATCH_SIZE;
    const concurrent = OPENAI_CONFIG.PARALLEL_CONCURRENT;
    
    const batches = this.chunkArray(items, batchSize);
    const allResults = [];
    
    console.log(`📦 Processing ${batches.length} batches (${concurrent}x parallel)...`);
    
    for (let i = 0; i < batches.length; i += concurrent) {
      const batchGroup = batches.slice(i, i + concurrent);
      
      console.log(`  Group ${Math.floor(i/concurrent) + 1}: Batches ${i + 1}-${i + batchGroup.length}`);
      
      // Process multiple batches in parallel using Promise.all
      const groupResults = await Promise.all(
        batchGroup.map(async (batch, idx) => {
          try {
            const labels = await this.labelBatch(batch, schema);
            console.log(`    ✓ Batch ${i + idx + 1} done (${labels.length} items)`);
            return labels;
          } catch (error) {
            console.error(`    ✗ Batch ${i + idx + 1} failed:`, error.message);
            return [];
          }
        })
      );
      
      allResults.push(...groupResults.flat());
      
      // Update progress after each group
      await progressService.updateProgress(datasetId);
    }
    
    return allResults;
  }
  
  /**
   * Label a single batch (called by all strategies)
   */
  async labelBatch(items, schema) {
    const itemsText = items.map((item, idx) => 
      `${idx + 1}. "${fileService.extractText(item.originalData)}"`
    ).join('\n');
    
    const prompt = this.buildPrompt(schema, itemsText);
    
    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [
        { 
          role: "system", 
          content: "You are a data labeling assistant. Always respond with valid JSON only." 
        },
        { role: "user", content: prompt }
      ],
      temperature: OPENAI_CONFIG.TEMPERATURE,
      max_tokens: OPENAI_CONFIG.MAX_TOKENS
    });
    
    const labels = this.parseLabels(response.choices[0].message.content);
    await this.saveLabels(items, labels);
    
    return labels;
  }
  
  /**
   * Build prompt for OpenAI
   */
  buildPrompt(schema, itemsText) {
    return `${schema}

Label the following items according to the schema above.

Items:
${itemsText}

Respond ONLY with a JSON array in this exact format:
[
  {"index": 1, "label": "category_name", "confidence": 0.95, "reasoning": "brief explanation"},
  {"index": 2, "label": "category_name", "confidence": 0.88, "reasoning": "brief explanation"}
]

Rules:
- confidence must be between 0 and 1
- reasoning should be brief (max 100 characters)
- label must match one of the categories in the schema`;
  }
  
  /**
   * Parse OpenAI response to extract labels
   */
  parseLabels(content) {
    try {
      // Remove markdown code blocks if present
      let cleaned = content.trim()
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Parse JSON
      const labels = JSON.parse(cleaned);
      
      // Validate structure
      if (!Array.isArray(labels)) {
        throw new Error('Response is not an array');
      }
      
      // Validate each label
      labels.forEach(label => {
        if (!label.index || !label.label || label.confidence === undefined) {
          throw new Error('Invalid label structure');
        }
      });
      
      return labels;
      
    } catch (error) {
      console.error('❌ Failed to parse labels:', error.message);
      console.error('Raw content:', content);
      throw new Error('Failed to parse OpenAI response: ' + error.message);
    }
  }
  
  /**
   * Save labels to database
   */
  async saveLabels(items, labels) {
    try {
      const bulkOps = labels.map((label, idx) => {
        if (idx >= items.length) {
          console.warn(`⚠️  Label index ${label.index} exceeds items array length`);
          return null;
        }
        
        return {
          updateOne: {
            filter: { _id: items[idx]._id },
            update: {
              aiLabel: label.label,
              aiConfidence: Math.min(Math.max(label.confidence, 0), 1), // Clamp 0-1
              aiReasoning: label.reasoning || '',
              reviewStatus: this.determineReviewStatus(label.confidence),
              labeledAt: new Date()
            }
          }
        };
      }).filter(op => op !== null);
      
      if (bulkOps.length > 0) {
        await DataItem.bulkWrite(bulkOps);
      }
      
    } catch (error) {
      console.error('❌ Failed to save labels:', error);
      throw error;
    }
  }
  
  /**
   * Determine review status based on confidence
   */
  determineReviewStatus(confidence) {
    if (confidence >= 0.90) return 'auto_accepted';
    if (confidence >= 0.70) return 'needs_review';
    return 'low_confidence';
  }
  
  /**
   * Split array into chunks
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

module.exports = new LabelingService();