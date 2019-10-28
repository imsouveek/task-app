const jwt = require('jsonwebtoken');
const User = require('../models/users');

const auth = async function(req, res, next) {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, 'Random14Chars!');
    
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();

  } catch (err) {
    res.status(401).send({
      error: 'Please authenticate'
    })
  }
} 

module.exports = auth;