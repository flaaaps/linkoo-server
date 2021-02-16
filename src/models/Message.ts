import mongoose from 'mongoose';
import shortid from 'shortid';

import Model from './Model.js';

const MessageSchema = new mongoose.Schema({
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
    read: {
        type: Boolean,
        default: false,
        required: true
    }
});

export interface Message {
    userId: string;
    id: string;
    content: string;
    createdAt: number;
    read: boolean
}

const MessageModel = mongoose.model<Model<Message>>('Message', MessageSchema, 'messages');

export default MessageModel;
