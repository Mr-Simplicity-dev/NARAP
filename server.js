
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const User = require('./models/User');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(session({
  secret: 'admin_secret',
  resave: false,
  saveUninitialized: true
}));

const mongoURI = "mongodb+srv://Simplicity:Onimisi2323$@cluster0.if6io47.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error', err));

function isAuthenticated(req, res, next) {
  if (req.session.admin) return next();
  res.status(401).send('Unauthorized');
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    req.session.admin = true;
    res.send('Login success');
  } else {
    res.status(401).send('Wrong credentials');
  }
});

app.post('/api/addUser', isAuthenticated, async (req, res) => {
  try {
    const { name, email, password, code } = req.body;
    const newUser = new User({ name, email, password, code });
    await newUser.save();
    res.send('User added');
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.get('/api/getUsers', isAuthenticated, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.delete('/api/deleteUser/:id', isAuthenticated, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.send('User deleted');
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.delete('/api/deleteAllUsers', isAuthenticated, async (req, res) => {
  try {
    await User.deleteMany({});
    res.send('All users deleted');
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
