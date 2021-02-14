import * as mongoose from 'mongoose';
import * as shortid from 'shortid';

import Model from './Model.js';

const UserSchema = new mongoose.Schema({
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

export interface User {
    identifier: string;
    name: string;
    createdAt: number;
}

export const UserModel = mongoose.model<Model<User>>('user', UserSchema, 'users');
