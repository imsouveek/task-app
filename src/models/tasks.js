const mongoose = require('mongoose');

module.exports = mongoose.model(
  "Task",
  {
    description: {
      type: String,
      trim: true,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    }
  }
);