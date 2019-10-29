/*
  Middleware for client-side token based authentication
*/
const jwt = require('jsonwebtoken');
const User = require('../models/users');

const auth = async function(req, res, next) {
  try {
    // Get the token in request header in "Authorization" parameter
    const token = req.header('Authorization').replace('Bearer ', '');

    // Verify token using library
    const decoded = jwt.verify(token, 'Random14Chars!');
    
    /*
      Token is created using user._id. Also all generated tokens are saved to db.
      Therefore, using the id and token parameter to verify that user id and token
      are valid
    */
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
    if (!user) {
      throw new Error();
    }

    /*
      Have to set user in request object so that express route handlers don't have to 
      query for user again. Need token for logout route handler to delete token during
      logout
    */
    req.token = token;
    req.user = user;

    // Have to call next to call next middleware / route handler
    next();

  } catch (err) {
    res.status(401).send({
      error: 'Please authenticate'
    })
  }
} 

module.exports = auth;