/*
  Application entry point
*/
const express = require('express');

// Connect to mongodb
require('./db/odm-connection');

// Start server definition
const app = express();

// Identify port
const port = process.env.PORT;

// Parse request body as json
app.use(express.json());

// Setup routes on users and tasks
app.use('/users', require('./routes/users'));
app.use('/tasks', require('./routes/tasks'));

// Start Server
app.listen(port,() => {
  console.log(`Server listening on port ${port}`);
});

// Error handler
app.use((err, req, res, next) => {
  res.send({
    error: err.message
  })
});