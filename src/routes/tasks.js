/*
  Define all routes for tasks
*/
const express = require('express');
const Task = require('../models/tasks');
const auth = require('../middleware/auth');

const router = express.Router();

// Route for creating a task
router.post('/', auth, async (req, res) => {

  /* 
    Request object will have user object attached to it. Use that
    as well as request body to create a new task
  */
  const new_task = new Task({
    ...req.body,
    owner: req.user._id 
  });

  try {

    // Save new task and respond to client
    await new_task.save();
    res.status(201).send(new_task);

  } catch (err) {
    res.status(400).send(err);
  }
});

/*
  Path to list all tasks. Allowed query options are:-
  * completed [true/false] Filter on completed or incomplete tasks
  * limit     [number    ] How many rows to retrieve
  * skip      [number    ] How many rows of results to skip before retrieving rows
  * sortBy    [string    ] E.g, description_desc,completed_desc
*/
router.get('/', auth, async (req, res) => {
  const match = {};
  const sort = {};

  // Setup filters
  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  }

  // Setup sorting of results
  if (req.query.sortBy) {
    const sortArray = req.query.sortBy.split(',');
    sortArray.forEach(item => {
      const sortlist = item.split('_');
      sort[sortlist[0]] = sortlist[1] === 'asc'? 1: -1;
    })
  }

  try {

    // Populate all tasks for user
    await req.user.populate({
      path: 'tasks',
      match, 
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate();
    const result = req.user.tasks;

    // Send result to  client if found. Else, send error
    if (result.length <= 0) {
      res.status(204).end();
    } else {
      res.status(200).send(result);
    }

  } catch (err) {
    res.status(500).send(err);
  }
});

// Path to get one task
router.get('/:id', auth, async (req, res) => {

  try {

    // Find task using task id and user id
    const result = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    // Send result to  client if found. Else, send error
    if (!result) {
      res.status(404).end();
    } else {
      res.status(200).send(result);
    }

  } catch (err) {
    res.status(500).send(err);
  }
});

// Path to update one task
router.patch('/:id', auth, async (req, res) => {

  // Validate updates. _id, _v and owner cannot be updated
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  // If trying to update invalid field, throw error
  if (!isValid) {
    return res.status(400).send('Invalid update');
  }

  try {

    /*
      Find task, if exists for current user and update it. Using 2 steps
      instead of findOneandUpdate to ensure that mongoose "save" middleware
      is running
    */
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    // If task is not found, throw error
    if (!task) {
      return res.status(404).end();
    }

    // Update task found and respond to client
    updates.forEach(update => {
      task[update] = req.body[update];
    });

    await task.save();
    res.status(200).send(task);

  } catch (err) {
    res.status(400).send(err);
  }
});

// Path to delete a task
router.delete('/:id', auth, async (req, res) => {
  try {

    // Find task and delete - has to be task for current user
    const result = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    // If delete succeeds, send deleted task to client. Else send error
    if (!result) {
      res.status(404).end();
    } else {
      res.status(200).send(result);
    }
    
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;