const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const Question = require('./models/Question');

const app = express();

mongoose.connect('mongodb://localhost:27017/nodeWeb')
    .then(() => console.log('MongoDB [+]'))
    .catch(err => console.log(err));

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'SECRET_KEY',
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isDarkMode = req.session.isDarkMode || false;
    next();
});

app.set('view engine', 'ejs');

app.use('/', authRoutes);

app.get('/', async (req, res) => {
    try {
        const searchQuery = req.query.search;
        let questions;

        if (searchQuery) {
            questions = await Question.find({
                title: { $regex: searchQuery, $options: 'i' }
            }).populate('user', 'username');
        } else {
            questions = await Question.find().populate('user', 'username');
        }

        const message = questions.length === 0 ? (searchQuery ? 'Arama sonucu bulunamadı.' : null) : null;

        res.render('index', { 
            questions, 
            message,
            searchQuery
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Bir hata oluştu');
    }
});

app.listen(3000, () => {
    console.log('ip:3000 [+]');
});
