
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const mongoURI = "mongodb+srv://Simplicity:Onimisi2323%24@cluster0.if6io47.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected ✅'))
    .catch((err) => console.error('MongoDB Connection Error ❌', err));

app.post('/api/addUser', async (req, res) => {
    try {
        const { name, email, password, code } = req.body;
        const newUser = new User({ name, email, password, code });
        await newUser.save();
        res.status(201).send('User added');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.get('/api/getUsers', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.delete('/api/deleteUser/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.send('User deleted');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.delete('/api/deleteAllUsers', async (req, res) => {
    try {
        await User.deleteMany({});
        res.send('All users deleted');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.post('/api/forgotPassword', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (user) {
            res.send(`Password reset link (mocked): ${email}`);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.post('/api/submitCode', async (req, res) => {
    try {
        const { code } = req.body;
        const user = await User.findOne({ code });
        if (user) {
            res.send('Code valid');
        } else {
            res.status(404).send('Invalid code');
        }
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.listen(port, () => console.log(`Server running on port ${port} 🚀`));
