const express = require('express');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const uri = "mongodb+srv://test1:test1@cluster0.7nihy3k.mongodb.net/"
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const User = require('./user');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.log(err));

// async function connectDB() {
//     try {
//         await client.connect();
//         console.log('Connected to MongoDB successfully!');
//         return client.db("database");
//     } catch (err) {
//         console.log('Failed to connect to MongoDB', err);
//     }
// }

// async function findUsers() {
//     try {
//         await client.connect();
//         console.log('Connected to MongoDB successfully!');

//         const db = client.db("test");
//         const collection = db.collection('users');

//         const users = await collection.find({}).toArray();
//         console.log('Found users:', users);
//         return users;
//     } catch(err) {
//         console.error(err);
//     }
// }

const db = client.db("test");

app.get('/users', async (req, res) => {
    const collection = db.collection('users');
    try {
        const users = await collection.find({}).toArray();
        console.log('Found users:', users);
        res.json(users);
    } catch (err) {
        console.error('Failed to find users', err);
        res.status(500).json({ message: 'Failed to find users' });
    }
});

app.post('/register', async (req, res) => {
    const { name, email } = req.body;

    const collection = db.collection('users');

    try {
        const result = await collection.insertOne({ name, email });
        res.json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error('Failed to register user', err);
        res.status(500).json({ message: 'Failed to register user' });
    }
});

app.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    const collection = db.collection('users');

    try {
        const objectId = new mongoose.Types.ObjectId(id);

        const result = await collection.updateOne({ _id: objectId }, { $set: { name, email } });
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully!' });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        console.error('Failed to update user', err);
        res.status(500).json({ message: 'Failed to update user' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});