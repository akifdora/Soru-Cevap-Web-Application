const express = require('express');
const router = express.Router();
const { getQuestions, register, login, logout, ask, getRegister, getLogin, getQuestion, postComment } = require('../controllers/authController');
const mongoose = require('mongoose'); // mongoose'i ekleyin
const Question = require('../models/Question'); // Question modelini ekleyin

function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

router.get('/', getQuestions);

// Kayıt sayfası
router.get('/register', getRegister);
router.post('/register', register);

// Giriş sayfası
router.get('/login', getLogin);
router.post('/login', login);

// Çıkış işlemi
router.get('/logout', logout);

// Sorunun detaylarını gösteren rota
router.get('/question/:id', getQuestion);
router.post('/question/:id/comments', postComment);

// Soru sorma sayfası rotası
router.get('/ask', ensureAuthenticated, ask);

router.post('/ask', ensureAuthenticated, async (req, res) => {
    const { title, content } = req.body;

    try {
        const newQuestion = new Question({
            title,
            content,
            user: req.session.user._id // Kullanıcıyı ekleyin
        });
        await newQuestion.save();
        res.redirect('/'); // Ana sayfaya yönlendir
    } catch (error) {
        console.error(error);
        res.status(500).send('Bir hata oluştu');
    }
});

module.exports = router;
