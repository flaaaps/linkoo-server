import mongoose, { Model } from 'mongoose';
import { User, UserModel } from '../models/User.js';

export async function username(id: string, returnDoc: boolean = true): Promise<boolean | User> {
    console.log('[Validate | Username] Starting validation for user with id', id);
    let response: any = false;
    await UserModel.findOne({ identifier: id }, (err, doc: User) => {
        console.log('[Validate | Username] User document: ', doc);
        if (err || !doc) return;
        doc = {
            identifier: doc.identifier,
            name: doc.name,
            createdAt: doc.createdAt,
        };
        if (returnDoc) response = doc;
        else response = true;
    });
    console.log('[Validate | Username] Response:', response);
    return response;
}
