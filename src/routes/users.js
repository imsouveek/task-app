const express = require('express');
const User = require('../models/users');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  const new_user = new User(req.body);

  try {
    await new_user.save();

    const token = await new_user.getAuthToken();
    res.status(201).send({ new_user, token });
  } catch(err) {
    res.status(400).send(err);
  }
});

router.post('/login', async (req, res) => {
  try{
    if (!req.body.email || !req.body.password) {
      throw new Error('Need both email and password to login');
    }
    
    const user = await User.getCredentials(req.body.email, req.body.password);
    const token = await user.getAuthToken();

    res.status(200).send({ user, token });
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get('/logout', auth, async(req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);

    req.user.save();
    res.send('Logged out successfully');
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/logoutAll', auth, async(req, res) => {
  try {
    req.user.tokens = [];

    req.user.save();
    res.send('Logged out successfully');
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/', auth, async (req, res) => {
  res.send(req.user);
});

router.patch('/', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isValid) {
    return res.status(400).send('Invalid request');
  }

  try {
    updates.forEach(update => {
      req.user[update] = req.body[update]
    });

    await req.user.save();
    res.status(200).send(req.user)
  } catch (err) {
    res.status(400).send(err);
  }
})

router.delete('/', auth, async (req, res) => {
  try {
    req.user.remove();
    res.status(200).send(req.user);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;