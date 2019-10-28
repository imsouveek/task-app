const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./tasks');

// Define the base schema
const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
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
  age: {
    type: Number,
    default: 18,
    min: [0, "Age cannot be negative"],
    max: [100, "Expecting human age"]
  },
  tokens: [{
    token: {
      required: true,
      type: String
    }
  }]
});

userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
});

// Define custom JSON conversion method
userSchema.methods.toJSON = function() {
  const user = this.toObject();

  delete user.password;
  delete user.tokens;

  return user;
}
// Define methods on instances of document
userSchema.methods.getAuthToken = async function() {
  try {
    const token = jwt.sign({_id: this._id.toString()}, 'Random14Chars!');
    this.tokens = this.tokens.concat({ token });

    await this.save();
    return token;
  } catch (err) {
    throw new Error("Failed to generate and save token")
  }
};

// Define methods on model itself
userSchema.statics.getCredentials = async function(email, password) {
  const user = await this.findOne({ email });

  if (!user) {
    throw new Error("Invalid userid or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid userid or password");
  }

  return user;
};

// Define Mongoose middleware that run before each save
userSchema.pre('save', async function(next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  
  next();
});

// Delete tasks when user is deleted
userSchema.pre('remove', async function(next) {
  await Task.deleteMany({
    owner: this._id
  })
  next();
});

module.exports = mongoose.model(
  'User',
  userSchema
);