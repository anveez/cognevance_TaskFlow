
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

// All task routes require authentication
router.use(authMiddleware);

// Create a task
router.post('/', createTask);

// Get all tasks for the logged-in user
router.get('/', getTasks);

// Update a task by ID
router.patch('/:id', updateTask);

// Delete a task by ID
router.delete('/:id', deleteTask);

module.exports = router;
