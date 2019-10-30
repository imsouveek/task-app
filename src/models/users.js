/*
  Define user schema and user model
*/
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./tasks');

// Define the base schema
const userSchema = mongoose.Schema({

  // User Name
  name: {
    type: String,
    required: true,
    trim: true
  },

  // User Email. This is required and unique
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error ('Email is invalid');
      }
    }
  },

  // User Password
  password: {
    type: String,
    trim: true,
    required: true,
    minlength: 6,
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        throw new Error ('Password cannot contain the string "password"');
      }
    }
  },

  // User's age
  age: {
    type: Number,
    default: 18,
    min: [0, "Age cannot be negative"],
    max: [100, "Expecting human age"]
  },

  // User's profile image
  avatar: {
    type: Buffer
  },
  
  // All auth tokens created by user
  tokens: [{
    token: {
      required: true,
      type: String
    }
  }]
}, {
  
  // Enable timestamps for audit 
  timestamps: true
});

/*
  Virtual method on userSchema lets mongoDb know all children of user schema. This 
  allows all a user's tasks to be fetched
*/
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
});

/*
  Define custom JSON conversion method. This allows us to remove sensitive data from
  the response to the client
*/
userSchema.methods.toJSON = function() {
  const user = this.toObject();

  // Delete sensitive data
  delete user.password;
  delete user.tokens;
  delete user.avatar;
  
  return user;
}

/*
  Define a new method on user document. Generating token anyway requires the _id field
  of userSchema, and having it as a method on a document allows it to be called easily
  and also allows saving of token on user document easily
*/
userSchema.methods.getAuthToken = async function() {
  try {
    // Create Token
    const token = jwt.sign({_id: this._id.toString()}, 'Random14Chars!');
    
    /*
      Append token to user document. This allows users to login from multiple devices
      but also ensures secure login
    */
    this.tokens = this.tokens.concat({ token });

    // Save user and return token
    await this.save();
    return token;

  } catch (err) {
    throw new Error("Failed to generate and save token")
  }
};

/*
  Define methods on model itself. This method is for login users only and 
  allows easy verification of user email and password
*/
userSchema.statics.getCredentials = async function(email, password) {
  const user = await this.findOne({ email });

  // Get user using email address
  if (!user) {
    throw new Error("Invalid userid or password");
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid userid or password");
  }

  // Return user details if user / password verification is successful
  return user;
};

/*
  Define Mongoose middleware that run before each save. This middleware
  allows password to be hashed before saving user but also ensures that
  password is not hashed multiple times
*/
userSchema.pre('save', async function(next) {
  const user = this;

  // Only has password if password has changed
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  
  // Without next() call, mongoose does not know that middleware completed
  next();
});

/*
  Delete tasks when user is deleted. This prevents orphan tasks
*/
userSchema.pre('remove', async function(next) {
  await Task.deleteMany({
    owner: this._id
  })

  // Without next() call, mongoose does not know that middleware completed
  next();
});

module.exports = mongoose.model(
  'User',
  userSchema
);