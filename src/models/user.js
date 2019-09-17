const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

// cache db collection schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 7,
    required: true,
    trim: true,
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        throw new Error('Error: password cannot contain "password"')
      }
    }
  },
  age: {
    type: Number,
    validate(value) {
      if (value < 0) {
        throw new Error('Age cannot be less than 0.')
      }
    },
    default: 0
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid')
      }
    },
    trim: true,
    lowercase: true
  }
})

// returns user document for given email and password combo
userSchema.statics.findByCredentials = async (email, password) => {
  // SELECT the user document by email
  const user = await User.findOne({ email })

  if (!user) {
    // no user with that email found
    throw new Error('Unable to log in')
  }

  // compare given password with document password
  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    // passwords don't match
    throw new Error('Unable to log in')
  }

  // email and passwords match, return user document
  return user
}

// password hashing middleware; runs before any call to .save()
userSchema.pre('save', async function (next) {
  const user = this // for readability; this = document calling .save()

  // if password field is created of modified
  if (user.isModified('password')) {
    // encrypt the pw
    user.password = await bcrypt.hash(user.password, 9)
  }

  next() // calls the next middlware in lexical order
})

// define field model for users collection
// mongoose automatically creates collection with plural+lowercase name of model
const User = mongoose.model('User', userSchema)

module.exports = User
