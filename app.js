const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv/config');

const UserModel = require('./models/User.js');
const MessageModel = require('./models/Message.js');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, (err) => {
    if (err) return console.log('An error occurred while connection to db', err);
    console.log('Connected to db');
});

const app = express();

console.log(process.env.NODE_ENV, 'NODENEV');
const origin = process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : ['https://the-linkoo.netlify.app/'];
app.use(cors({ origin: origin }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send({ success: true, NODE_ENV: process.env.NODE_ENV, origin: origin });
});

app.post('/register', async (req, res) => {
    if (!req.body.name) return res.send({ success: false, message: 'Please specify a name' });
    const user = new UserModel({
        name: req.body.name,
    });
    user.save().then((doc) => {
        console.log('Saved user:', doc);
        res.send({ success: true, user: { identifier: doc.identifier, name: doc.name, createdAt: doc.createdAt } });
    });
});

app.post('/login', async (req, res) => {
    const userId = req.body.userId;
    console.log(userId, req.body);
    if (!userId) return res.send({ success: false, message: 'Please provide a user id' });
    await UserModel.findOne({ identifier: userId }, (err, doc) => {
        if (err) return res.send({ success: false, message: 'An unexpected error occurred.' });
        doc = {
            identifier: doc.identifier,
            name: doc.name,
            createdAt: doc.createdAt,
        };
        res.send({ success: true, user: doc });
    });
});

app.post('/messages/create', async (req, res) => {
    const userId = req.body.userId;
    const content = req.body.content;
    if (!userId || !content) return res.send({ success: false, message: 'Please provide a user id and content' });

    const user = await UserModel.findOne({ identifier: userId });
    if (!user) return res.send({ success: false, message: `User with id ${userId} not found.` });
    const message = new MessageModel({
        userId,
        content,
    });
    message.save().then((doc) => {
        console.log('Saved message:', doc);
        res.send({ success: true });
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

module.exports = app;
