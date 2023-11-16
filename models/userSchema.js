const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : [true, 'Please enter your name']
    },
    email : {
        type : String,
        required : [true, 'Please enter your email address'],
        unique : true,
        validate : [validator.isEmail, 'Please enter a valid email address']
    },
    role : {
        type : String,
        enum : {
            values : ['user','employer'],
            message : 'Please select a valid role'
        },
        default : 'user'
    },
    password : {
        type : String,
        required : [true, 'Please enter a password'],
        minlength : [8, 'Your password must be at least 8 characters long'],
        select : false
    },
    createdAt : {
        type : Date,
        default : Date.now
    },
    resetPasswordToken : String,
    resetPasswordExpire : String
});

// Encrypting password before storing
userSchema.pre('save', async function(next){

    // if user password is not modified, do not hash it
    if (!this.isModified('password')) {
        next()
    }

    this.password = await bcrypt.hash(this.password, 10)
});

// Return JSON web token
userSchema.methods.getJwtToken = function() {
    return jwt.sign({ id : this._id}, process.env.JWT_SECRET, {
        expiresIn : process.env.JWT_EXPIRES_TIME
    })
};

// Check password with input
userSchema.methods.comparePasswords = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    // Set expiry time 30min after token generation
    this.resetPasswordExpire = Date.now() + 30*60*1000;

    return resetToken;
}

module.exports = mongoose.model('User', userSchema)