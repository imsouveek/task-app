const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../src/models/users');
const Task = require('../../src/models/tasks');

// Setup reference objects
const userOneId = new mongoose.Types.ObjectId();
const userTwoId = new mongoose.Types.ObjectId();

/*
  Want to setup one user with two tokens for logoutAll functionality.
  Therefore creating tokens separately and putting a loop in between
  to ensure that tokens are not identical
  */
const token1 = jwt.sign({ _id: userOneId}, process.env.TOKEN_SALT);
for (i = 0; i < 2000000; ++i);
const token2 = jwt.sign({ _id: userOneId}, process.env.TOKEN_SALT);

const userOneObj = {
  _id: userOneId,
  name: 'Samragni',
  email: 'samragnir@gmail.com',
  password: 'TEST123!',
  age: 30,
  tokens: [{
    token: token1,
  }, {
    token: token2,
  }]
};

const userTwoObj = {
  _id: userTwoId,
  name: 'Mike',
  email: 'mike@gmail.com',
  password: 'PATCH123!',
  age: 34,
  tokens: [{
    token: jwt.sign({ _id: userTwoId}, process.env.TOKEN_SALT),
  }]
};

const taskOneObj = {
  _id: new mongoose.Types.ObjectId(),
  description: 'First Task',
  completed: false,
  owner: userOneObj._id
};

const taskTwoObj = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Second Task',
  completed: true,
  owner: userOneObj._id
};

const taskThreeObj = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Third Task',
  completed: false,
  owner: userTwoObj._id
};

/*
  Script to run before each test case execution. Here we are resetting the database to
  have specific users and tasks, especially to ensure that tests e.g., create to pass each time
*/
const setupDb = async () => {
  await User.deleteMany();
  await Task.deleteMany();
  await new User(userOneObj).save();
  await new User(userTwoObj).save();
  await new Task(taskOneObj).save();
  await new Task(taskTwoObj).save();
  await new Task(taskThreeObj).save();
};

module.exports = {
  userOneId,
  userOneObj,
  userTwoObj,
  setupDb,
  taskOneObj,
  taskTwoObj,
  taskThreeObj
}