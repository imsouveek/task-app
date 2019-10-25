const express = require('express');
require('./db/odm-connection');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/users', require('./routes/users'));
app.use('/tasks', require('./routes/tasks'));

app.listen(port,() => {
  console.log(`Server listening on port ${port}`);
});