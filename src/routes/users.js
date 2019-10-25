const express = require('express');
const User = require('../models/users');

const router = express.Router();

router.post('/', async (req, res) => {
  const new_user = new User(req.body);

  try {
    await new_user.save();
    res.status(201).send(new_user);
  } catch(err) {
    res.status(400).send(err);
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await User.find({});
    if (!result) {
      res.status(204).end();
    } else {
      res.status(200).send(result);
    }
  } catch(err) {
    res.status(500).send(err)
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await User.findById(req.params.id)
    if (!result) {
      res.status(404).end();
    } else {
      res.status(200).send(result);
    }
  } catch(err) {
    res.status(500).send(err);
  }
});

router.patch('/:id', async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isValid) {
    return res.status(400).send('Invalid request');
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
        useFindAndModify: false
      }
    );

    if (!user) {
      res.status(404).end();
    } else {
      res.status(200).send(user)
    }
  } catch (err) {
    res.status(400).send(err);
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
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