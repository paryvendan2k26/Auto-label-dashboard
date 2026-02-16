// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

const corsOptions = {
  origin: [
    'https://auto-label-dashboard-6xxc.vercel.app/',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  optionsSuccessStatus: 200
};


// Middleware
app.use(cors(corsOptions));


app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Automated Labeling API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      datasets: '/api/datasets',
      labels: '/api/labels',
      stats: '/api/stats'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/datasets', require('./routes/dataset.routes'));
app.use('/api/labels', require('./routes/label.routes'));
app.use('/api/stats', require('./routes/stats.routes'));

// 404 handler (must come before error handler)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Automated Labeling Dashboard - Backend');
  console.log('='.repeat(50));
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: Connected`);
  console.log('='.repeat(50));
  console.log('\n📚 Available Routes:');
  console.log('   GET    /');
  console.log('   GET    /health');
  console.log('   POST   /api/auth/register');
  console.log('   POST   /api/auth/login');
  console.log('   GET    /api/auth/me');
  console.log('   POST   /api/datasets/upload');
  console.log('   GET    /api/datasets');
  console.log('   GET    /api/datasets/:id');
  console.log('   POST   /api/datasets/:id/configure');
  console.log('   POST   /api/labels/dataset/:id/label');
  console.log('   GET    /api/labels/dataset/:id/review-queue');
  console.log('   PUT    /api/labels/:id');
  console.log('   POST   /api/labels/batch-accept');
  console.log('   GET    /api/stats/dataset/:id/progress');
  console.log('   GET    /api/stats/dataset/:id/statistics');
  console.log('   GET    /api/stats/dataset/:id/queue-summary');
  console.log('   GET    /api/stats/dataset/:id/export');
  console.log('\n💡 Press CTRL+C to stop\n');
});