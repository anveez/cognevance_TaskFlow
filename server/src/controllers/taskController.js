
const Task = require('../models/Task');

// Create a new task
async function createTask(req, res) {
  try {
    const { title, description, dueDate, priority } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: 'Task title is required'
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      dueDate: dueDate || null,
      priority,
      user: req.userId
    });

    return res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message
      });
    }

    console.error('Create task error:', error.message);

    return res.status(500).json({
      message: 'Unable to create task'
    });
  }
}

// Get all tasks belonging to the logged-in user
async function getTasks(req, res) {
  try {
    const tasks = await Task.find({
      user: req.userId
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error.message);

    return res.status(500).json({
      message: 'Unable to retrieve tasks'
    });
  }
}

// Update a task
async function updateTask(req, res) {
  try {
    const allowedFields = [
      'title',
      'description',
      'dueDate',
      'priority',
      'completed'
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (
      updates.title !== undefined &&
      (typeof updates.title !== 'string' || !updates.title.trim())
    ) {
      return res.status(400).json({
        message: 'Task title cannot be empty'
      });
    }

    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    if (
      updates.completed !== undefined &&
      typeof updates.completed !== 'boolean'
    ) {
      return res.status(400).json({
        message: 'Completed must be true or false'
      });
    }

    if (
      updates.description !== undefined &&
      typeof updates.description !== 'string'
    ) {
      return res.status(400).json({
        message: 'Description must be text'
      });
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.userId
      },
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    return res.status(200).json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    if (error.name === 'ValidationError' ||
        error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid task data or task ID'
      });
    }

    console.error('Update task error:', error.message);

    return res.status(500).json({
      message: 'Unable to update task'
    });
  }
}

// Delete a task
async function deleteTask(req, res) {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    return res.status(200).json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid task ID'
      });
    }

    console.error('Delete task error:', error.message);

    return res.status(500).json({
      message: 'Unable to delete task'
    });
  }
}

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask
};
