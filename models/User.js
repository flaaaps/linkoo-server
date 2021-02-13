const mongoose = require('mongoose');
const shortid = require('shortid');

const UserSchema = mongoose.Schema({
    identifier: {
        type: String,
        default: shortid.generate(),
    },
    name: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Number,
        default: Date.now(),
        required: true,
    },
});

const UserModel = mongoose.model('user', UserSchema, 'users');
module.exports = UserModel;
