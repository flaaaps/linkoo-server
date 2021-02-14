import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import * as tag from './utils/tag.js';
import shortid from 'shortid';

import cors from 'cors';
require('dotenv/config');

import { UserModel, User } from './models/User.js';
import MessageModel from './models/Message.js';

mongoose.connect(process.env.MONGO_URI!, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, (err) => {
    if (err) return console.log('An error occurred while connection to db', err);
    console.log('Connected to db');
});

const app = express();

const whiteLists = process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : ['https://linkoo.netlify.app/'];
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send({ success: true, NODE_ENV: process.env.NODE_ENV, origin: 'all :3' });
});

app.post('/register', async (req, res) => {
    const user = new UserModel({
        name: await tag.generate(),
    });
    user.save().then((doc) => {
        console.log('Saved user:', doc);
        res.send({ success: true, user: { identifier: doc.identifier, name: doc.name, createdAt: doc.createdAt } });
    });
});

app.post('/login', async (req, res) => {
    const name = req.body.name;
    console.log(name, req.body);
    if (!name) return res.send({ success: false, message: 'Please provide a user id' });
    await UserModel.findOne({ name: name }, (err, doc) => {
        if (err) return res.send({ success: false, message: 'An unexpected error occurred.' });
        doc = {
            identifier: doc.identifier,
            name: doc.name,
            createdAt: doc.createdAt,
        };
        console.log('Logged user in:', doc);
        res.send({ success: true, user: doc });
    });
});

app.post('/messages/create', async (req, res) => {
    const userId = req.body.userId;
    const content = req.body.content;
    console.log(req.body);
    if (!userId || !content) return res.send({ success: false, message: 'Please provide a "userId" and a "content" field' });

    const user = await UserModel.findOne({ identifier: userId });
    if (!user) return res.send({ success: false, message: `User with id ${userId} not found.` });
    const message = new MessageModel({
        id: shortid.generate(),
        userId,
        content,
    });
    message.save().then((doc) => {
        console.log('Saved message:', doc);
        res.send({ success: true, message: doc });
    });
});

app.get('/messages/all', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.send({ success: false, message: 'Please provide a user id' });

    MessageModel.find({ userId }, (err, docs) => {
        console.log('Error:', err);
        if (err) return res.send({ success: false });
        res.send({
            success: true,
            messages: docs.map((doc) => ({ id: doc.id, userId: doc.userId, content: doc.content, createdAt: doc.createdAt })),
        });
        console.log('Docs:', docs);
    });
});

export default app;
