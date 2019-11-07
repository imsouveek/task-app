/*
  Define all routes for users
*/
const express = require('express');
const User = require('../models/users');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendGoodByeEmail } = require('../emails/account');

const router = express.Router();

// Route to create a new user. Auth middleware is not required
router.post('/', async (req, res) => {

  // Use request body to create new user
  const new_user = new User(req.body);

  try {
    await new_user.save();
    sendWelcomeEmail(new_user.email, new_user.name);

    // If user creation succeeds, get token for client use
    const token = await new_user.getAuthToken();

    // Send user and token back to client
    res.status(201).send({ user: new_user, token });

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
router.get('/logout', auth, async (req, res) => {
  try {

    // Delete token passed from user details in mongodb
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
    await req.user.save();

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
    await req.user.save();

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
    await req.user.remove();
    sendGoodByeEmail(req.user.email, req.user.name);

    res.status(200).send(req.user);

  } catch (err) {
    res.status(500).send(err);
  }
});

// Setup middleware for handling file data
const upload = multer({

  // Set filesize limit
  limits: {
    fileSize: 1000000
  },

  // Callback error if file does not match requrirements
  fileFilter(req, file, cb) {
    if (!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
      cb(new Error('Need images only'));
    }
    cb(undefined, true);

  }
});

// Route to upload avatar. Using both auth and upload middleware
router.post('/avatar', auth, upload.single('upload'), async (req, res) => {

  // Ensure that file has been passed
  if (!req.file) {
    return res.status(400).send('Please provide image file');
  }

  try {
    /*
      Take file.buffer from multer - this is set because multer options do not
      specify any destination. Next, we resize it and convert it to png. Finally, we
      save the data
    */
    const buffer = await sharp(req.file.buffer)
      .resize(250, 250)
      .png()
      .toBuffer();
    req.user.avatar = buffer;

    // Save user with avatar set
    await req.user.save();
    res.status(200).send();

  } catch (err) {
    res.status(400).send();
  }

});

// Route to delete avatar
router.delete('/avatar', auth, async (req, res) => {

  // Set user.avatar to undefined to remove it
  req.user.avatar = undefined;
  req.user.avatar_mimetype = undefined;
  try {

    // Save user and respond to client
    await req.user.save();
    res.status(200).send();

  } catch (err) {
    res.status(400).send();
  }

});

// Route to get avatar
router.get('/avatar', auth, async(req, res) => {

  // Avatar should exist on user object
  if (!req.user.avatar) {
    return res.status(404).send();
  }

  // Set response header
  res.set('Content-Type', 'image/png');
  res.send(req.user.avatar)
})

module.exports = router;