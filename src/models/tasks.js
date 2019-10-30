/*
  Define task schema and model
*/
const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({

  // Task description
  description: {
    type: String,
    trim: true,
    required: true
  },

  // Task status
  completed: {
    type: Boolean,
    default: false
  },

  // Task owner. This is a reference to User objectid
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, {

  // Enable timestamps for audit
  timestamps: true
});

module.exports = mongoose.model(
  "Task",
  taskSchema
);