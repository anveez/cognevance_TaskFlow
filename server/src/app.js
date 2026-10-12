
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Task Manager API is running!'
  });
});
app.get('/', (_req, res) => res.json({ message: 'Task Manager API is running' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Registration and login
app.use('/api/auth', authRoutes);

// Protected task APIs
app.use('/api/tasks', taskRoutes);

module.exports = app;
