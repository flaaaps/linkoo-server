import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import * as tag from './utils/tag.js';
import shortid from 'shortid';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';

import cors from 'cors';
require('dotenv/config');

import { UserModel, User } from './models/User.js';
import MessageModel, { Message } from './models/Message.js';

import * as validate from './utils/validate.js';
import Model from './models/Model.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['*'],
        credentials: true,
    },
});

mongoose.connect(process.env.MONGO_URI!, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, (err) => {
    if (err) return console.log('An error occurred while connection to db', err);
    console.log('Connected to db');

    const client = mongoose.connection.getClient();
    const db = client.db('linkoo');
    const collection = db.collection('messages');
    const changeStream = collection.watch();
    changeStream.on('change', async (next: any) => {
        console.log('Something changed:', next);
        if (!next.fullDocument) return console.log("Err full document doesn't exist");
        const document = next.fullDocument as Message;
        const socketsInRoom = io.sockets.adapter.rooms.get(document.userId)?.size;

        if (socketsInRoom && socketsInRoom > 0) {
            MessageModel.updateOne({ id: document.id }, { $set: { read: true } }).then(() => console.log('Marked document as read.'));

            console.log('Sending document to user with id', document.userId);
            io.to(document.userId).emit('message', document);
        }
    });
});

io.on('connect', (socket: Socket) => {
    socket.on('login', async (identifier) => {
        console.log('Request at login socket');
        console.log(`Identifier:`, identifier);
        const response = await validate.username(identifier);
        if (!response) return socket.emit('login', 'Error while validating user');
        socket.join(identifier);
        socket.emit('login', { success: true, user: response });
        socket.on('leave', () => {
            socket.leave(identifier);
        });

        MessageModel.find({ userId: identifier, read: false }, (_, docs) => {
            docs.forEach((document) => {
                socket.emit('message', document);
                console.log(`> Retrospectively emitted ${document.id} to ${identifier}`);
                document.read = true;
                document.save();
            });
        });
    });
});
const whiteLists = process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : ['https://linkoo.netlify.app/'];
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send({ success: true, NODE_ENV: process.env.NODE_ENV, origin: 'all :3' });
});

app.post('/register', async (req, res) => {
    const user = new UserModel({
        identifier: shortid.generate(),
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
        if (!doc) return res.send({ success: false, message: 'User not found' });
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
        read: false,
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

app.post('/user/validate', async (req, res) => {
    console.log('Called validation route with id', req.body.userId);
    const validationResult = await validate.username(req.body.userId, false);
    console.log('Validation result:', validationResult);
    res.send({ success: validationResult });
});

// server.listen(process.env.PORT || '5441');
httpServer.listen(process.env.PORT || '5441');
// export default app;
