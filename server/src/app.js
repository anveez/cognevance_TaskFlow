const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Security middleware
app.use(helmet());

// Allowed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://anveez-taskflow-deploy-2026-5spn32uwg-abc-1542.vercel.app'
];

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests without an Origin header, such as health checks
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Root health check
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Task Manager API is running!'
  });
});

// API health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Task Manager API is running!'
  });
});

// Registration and login routes
app.use('/api/auth', authRoutes);

// Protected task routes
app.use('/api/tasks', taskRoutes);

// Export Express app for deployment
module.exports = app;