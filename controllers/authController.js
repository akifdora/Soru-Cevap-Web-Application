const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Question = require('../models/Question');
const Comment = require('../models/Comment');

// kayıt sayfası
exports.getRegister = (req, res) => {
    res.render('register');
};

// kayıt işlemi
exports.register = async (req, res) => {
    const { username, email, password, password2 } = req.body;
    let errors = [];

    if (password !== password2) {
        errors.push({ msg: 'Şifreler uyuşmuyor' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Şifre en az 6 karakter olmalı' });
    }

    if (errors.length > 0) {
        return res.render('register', {
            errors,
            username,
            email,
            password,
            password2
        });
    }

    try {
        let userEmail = await User.findOne({ email });
        if (userEmail) {
            errors.push({ msg: 'Bu e-posta adresi zaten kullanılıyor' });
            return res.render('register', {
                errors,
                username,
                email,
                password,
                password2
            });
        }

        let userName = await User.findOne({ username });
        if (userName) {
            errors.push({ msg: 'Bu kullanıcı adı adresi zaten kullanılıyor' });
            return res.render('register', {
                errors,
                username,
                email,
                password,
                password2
            });
        }

        user = new User({ username, email, password });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        req.session.success_msg = 'Başarıyla kayıt oldunuz, şimdi giriş yapabilirsiniz.';
        return res.redirect('/login');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Sunucu Hatası');
    }
};

// giriş sayfası
exports.getLogin = (req, res) => {
    const success_msg = req.session.success_msg;
    req.session.success_msg = null;
    res.render('login', { success_msg });
};

// giriş işlemi
exports.login = async (req, res) => {
    const { username, password } = req.body;
    let errors = [];

    try {
        const user = await User.findOne({ username });
        if (!user) {
            errors.push({ msg: 'Böyle bir kullanıcı yok' });
            return res.render('login', {
                errors,
                username,
                password
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            errors.push({ msg: 'Geçersiz giriş bilgileri' });
            return res.render('login', {
                errors,
                username,
                password
            });
        }

        req.session.user = user;
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// çıkış işlemi
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};

// soru sayfası
exports.ask = (req, res) => {
    res.render('ask');
};

exports.getQuestions = async (req, res) => {
    const searchQuery = req.query.search || '';

    try {
        const questions = await Question.find({ 
            title: { $regex: searchQuery, $options: 'i' }
        })
        .populate('user')
        .sort({ createdAt: -1 });

        res.render('index', {
            questions,
            searchQuery,
            user: req.session.user,
            isDarkMode: req.session.isDarkMode || false,
            message: questions.length === 0 ? 'Hiçbir sonuç bulunamadı' : ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Bir hata oluştu');
    }
};


exports.getQuestion = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).send('Geçersiz soru ID');
    }

    try {
        const question = await Question.findById(req.params.id)
            .populate('user')
            .populate({
                path: 'comments',
                populate: { path: 'user' }
            });

        res.render('question', {
            question,
            user: req.session.user,
            isDarkMode: req.session.isDarkMode || false
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Bir hata oluştu');
    }
};

exports.postComment = async (req, res) => {
    try {
        const questionId = req.params.id;
        const { content } = req.body;

        const newComment = new Comment({
            content,
            user: req.session.user._id,
            question: questionId
        });

        await newComment.save();

        await Question.findByIdAndUpdate(questionId, {
            $push: { comments: newComment._id }
        });

        res.redirect(`/question/${questionId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Yorum eklenirken bir hata oluştu');
    }
};
