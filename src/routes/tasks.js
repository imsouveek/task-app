const express = require('express');
const Task = require('../models/tasks');

const router = express.Router();

router.post('/', async (req, res) => {
  const new_task = new Task(req.body);
  try {
    await new_task.save();
    res.status(201).send(new_task);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await Task.find({});
    if (!result) {
      res.status(204).end();
    } else {
      res.status(200).send(result);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await Task.findById(req.params.id);
    if (!result) {
      res.status(404).end();
    } else {
      res.status(200).send(result);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.patch('/:id', async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isValid) {
    return res.status(400).send('Invalid update');
  }

  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
        useFindAndModify: false
      }
    );

    if (!task) {
      res.status(404).end();
    } else {
      res.status(200).send(task);
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Task.findByIdAndDelete(req.params.id);
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