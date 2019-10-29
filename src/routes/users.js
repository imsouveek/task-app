/*
  Define all routes for users
*/
const express = require('express');
const User = require('../models/users');
const auth = require('../middleware/auth');

const router = express.Router();

// Route to create a new user. Auth middleware is not required
router.post('/', async (req, res) => {

  // Use request body to create new user
  const new_user = new User(req.body);

  try {
    await new_user.save();

    // If user creation succeeds, get token for client use
    const token = await new_user.getAuthToken();

    // Send user and token back to client
    res.status(201).send({ new_user, token });

  } catch(err) {

    res.status(400).send(err);
  }
});

// Login route. Auth middleware is not required
router.post('/login', async (req, res) => {
  try{

    // Need email and password to be sent for login
    if (!req.body.email || !req.body.password) {
      throw new Error('Need both email and password to login');
    }
    
    // Use static method on User model to get user details
    const user = await User.getCredentials(req.body.email, req.body.password);

    // Use method on user document to generate and save token
    const token = await user.getAuthToken();

    // Respond back to client with user and token
    res.status(200).send({ user, token });

  } catch (err) {
    res.status(400).send(err);
  }
});

/* Logout route */
router.get('/logout', auth, async(req, res) => {
  try {

    // Delete token passed from user details in mongodb
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
    req.user.save();

    // Respond to client
    res.send('Logged out successfully');

  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to logout from all devices
router.get('/logoutAll', auth, async(req, res) => {
  try {

    // Delete all active tokens from user profile
    req.user.tokens = [];
    req.user.save();

    // Respond to client
    res.send('Logged out successfully');

  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to get own profile
router.get('/', auth, async (req, res) => {

  // Resond using user object set by auth middleware
  res.send(req.user);

});

// Route to update current user
router.patch('/', auth, async (req, res) => {

  // Validate fields that can be updated and throw error if required
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isValid) {
    return res.status(400).send('Invalid request');
  }

  try {

    // Set updated fields on user object
    updates.forEach(update => {
      req.user[update] = req.body[update]
    });

    // Save user object and send success response
    await req.user.save();
    res.status(200).send(req.user);

  } catch (err) {
    res.status(400).send(err);
  }
})

// Route to delete user
router.delete('/', auth, async (req, res) => {
  try {

    // Remove user set in auth middleware and send response to client
    req.user.remove();
    res.status(200).send(req.user);

  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;