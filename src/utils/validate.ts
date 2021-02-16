import mongoose, { Model } from 'mongoose';
import { User, UserModel } from '../models/User.js';

export async function username(name: string, returnDoc: boolean = true) {
    console.log('[Validate | Username] Starting validation for user with id', name);
    return await UserModel.findOne({ name: name }).then((doc) => {
        console.log('It is', !!doc);
        if (returnDoc) {
            if (!doc) return null;
            const newDoc = {
                identifier: doc.identifier,
                name: doc.name,
                createdAt: doc.createdAt,
            };
            return newDoc;
        } else {
            return !!doc;
        }
    });
}
