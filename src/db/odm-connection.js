const mongoose = require('mongoose');

const connectionURL = 'mongodb://127.0.0.1:27017';
const db = 'task-api';

mongoose
  .connect(`${connectionURL}/${db}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("Database connection successful"))
  .catch(() => console.log("Database connection failed"));