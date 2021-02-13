const mongoose = require('mongoose');
const shortid = require('shortid');

const MessageSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    id: {
        type: String,
        default: shortid.generate(),
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Number,
        default: Date.now(),
        required: true,
    },
});

const MessageModel = mongoose.model('Message', MessageSchema, 'messages');

module.exports = MessageModel;
