const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'https://anveez-taskflow.vercel.app',
  'https://anveez-taskflow-deploy-2026-5spn32uwg-abc-1542.vercel.app'
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Allow preview deployments for this specific Vercel project.
  return /^https:\/\/anveez-taskflow-deploy-2026-[a-z0-9]+-abc-1542\.vercel\.app$/.test(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Task Manager API is running!'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Task Manager API is running!'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

module.exports = app;