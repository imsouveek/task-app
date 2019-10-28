const express = require('express');
const Task = require('../models/tasks');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const new_task = new Task({
    ...req.body,
    owner: req.user._id 
  });
  try {
    await new_task.save();
    res.status(201).send(new_task);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get('/', auth, async (req, res) => {
  try {
    await req.user.populate('tasks').execPopulate();
    const result = req.user.tasks;
    if (!result) {
      res.status(204).end();
    } else {
      res.status(200).send(result);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    if (!result) {
      res.status(404).end();
    } else {
      res.status(200).send(result);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.patch('/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isValid) {
    return res.status(400).send('Invalid update');
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).end();
    }

    updates.forEach(update => {
      task[update] = req.body[update];
    });

    await task.save();
    res.status(200).send(task);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });
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