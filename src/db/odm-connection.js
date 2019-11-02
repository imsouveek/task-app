/*
  File to set up connectivity to MongoDB using Object Data Model. Alternative would be
  to use the official mongodb provider, but it would be missing many features that we
  might need
*/
const mongoose = require('mongoose');

const connectionURL = process.env.DB_CONNECTION_URL;
const db = process.env.DB_NAME;

mongoose
  .connect(`${connectionURL}/${db}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("Database connection successful"))
  .catch(() => console.log("Database connection failed"));

// Following line prevents deprecation warning
mongoose.set('useCreateIndex', true);
