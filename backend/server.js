const express = require('express');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const uri = "mongodb+srv://test1:test1@cluster0.7nihy3k.mongodb.net/"
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const User = require('./user');

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const cors = require('cors');
const bcrypt = require('bcryptjs');

require('dotenv').config(); // load environment variables

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(csrf({ cookie: true })); // csrf token

const db = client.db("userData");

function auth(req, res, next) {
    const header = req.headers['authorization'];
    const token = header && header.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const collection = db.collection('one');

    try {
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ message: 'User does not exist' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ username: user.username }, process.env.SECRET_TOKEN, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true });
        res.json({ token, csrfToken: req.csrfToken() });
    } catch (err) {
        console.error('Failed to login', err);
        res.status(500).json({ message: 'Failed to login' });
    }
});

app.get('/user', async (req, res) => {
    
    try {
        await client.connect();
        const collection = db.collection('one');
        const user = await collection.find({ email: req.query.email });
        if (user) {
            res.send(user);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error connecting to database');
    } finally {
        await client.close();
    }
});
app.get('/learned', async (req, res) => {
    try {
        await client.connect();
        const collection = db.collection('one');
        const user = await collection.find({ finishedTopic: req.query.finishedTopic });
        if (user) {
            res.send(user);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error connecting to database');
    } finally {
        await client.close();
    }
});
app.get('/ongoing', async (req, res) => {
    try {
        await client.connect();
        const collection = db.collection('one');
        const user = await collection.find({ ongoingTopic: req.query.ongoingTopic });
        if (user) {
            res.send(user);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error connecting to database');
    } finally {
        await client.close();
    }
});

app.get('/users', async (req, res) => {
    try {
        await client.connect();
        const collection = db.collection('one');
        const users = await collection.find().limit(5).toArray();
        if (users.length > 0) {
            res.send(users);
        } else {
            res.status(404).send('No users found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error connecting to database');
    } finally {
        await client.close();
    }
});


// post
app.post('/register', async (req, res) => {
    try {
        await client.connect();
        const collection = db.collection('one');
        const user = await collection.find({ email: req.query.email });
        if (user) {
            res.status(404).send('User with same email already exists');
        } else {
            const result = await collection.insertOne({ name: req.body.name, email: req.body.email, registerdate: new Date,lastLogin: new Date, activeTime: 0,finishedTopic : [], ongoingTopic:[],accuracyRate:0});
            res.send(`name: ${req.body.name}`);
        }
    } catch (err) { 
        console.error(err);
        res.status(500).send('Error connecting to database');
    } finally {
        await client.close();
    }
});

app.post('/logoff', async (req, res) => {
    try {
        await client.connect();
        const collection = db.collection('one');
        const result = await collection.updateOne(
            { email: req.body.email }, 
            { $set: { activeTime: req.body.activeTime,finishedTopic : req.body.finishedTopic, ongoingTopic:req.body.ongoingTopic,accuracyRate:req.body.accuracyRate, lastLogin:new Date} }
        );
        if (result.matchedCount > 0) {
            res.send(`User with email: ${req.body.email} updated successfully`);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) { 
        console.error(err);
        res.status(500).send('Error connecting to database');
    } finally {
        await client.close();
    }
});

// app.get('/users', async (req, res) => {
//     const collection = db.collection('users');
//     try {
//         const users = await collection.find({}).toArray();
//         console.log('Found users:', users);
//         res.json(users);
//     } catch (err) {
//         console.error('Failed to find users', err);
//         res.status(500).json({ message: 'Failed to find users' });
//     }
// });

// app.post('/register', async (req, res) => {
//     const { name, email } = req.body;

//     const collection = db.collection('users');

//     try {
//         const result = await collection.insertOne({ name, email });
//         res.json({ message: 'User registered successfully!' });
//     } catch (err) {
//         console.error('Failed to register user', err);
//         res.status(500).json({ message: 'Failed to register user' });
//     }
// });

// // get(/:id)

// app.put('/update/:id', async (req, res) => {
//     const { id } = req.params;
//     const { name, email } = req.body;

//     const collection = db.collection('users');

//     try {
//         const objectId = new mongoose.Types.ObjectId(id);

//         const result = await collection.updateOne({ _id: objectId }, { $set: { name, email } });
//         if (result.matchedCount === 0) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.json({ message: 'User updated successfully!' });
//     } catch (err) {
//         if (err.name === 'CastError') {
//             return res.status(400).json({ message: 'Invalid user ID' });
//         }
//         console.error('Failed to update user', err);
//         res.status(500).json({ message: 'Failed to update user' });
//     }
// });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});