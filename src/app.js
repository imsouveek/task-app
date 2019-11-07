/*
  Application entry point
*/
const express = require('express');

// Connect to mongodb
require('./db/odm-connection');

// Start server definition
const app = express();

// Parse request body as json
app.use(express.json());

// Setup routes on users and tasks
app.use('/users', require('./routes/users'));
app.use('/tasks', require('./routes/tasks'));

// Error handler
app.use((err, req, res, next) => {
  res.send({
    error: err.message
  })
});

// This is required for app to be used by test scripts or node start script
module.exports = app;