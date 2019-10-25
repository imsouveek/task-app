const mongoose = require('mongoose');
const validator = require('validator');

module.exports = mongoose.model(
  'User',
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      required: true,
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
    }
  }
);