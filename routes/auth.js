module.exports = function (passport) {
    var mongoose = require('../lib/db');
    var route=require('express').Router();

    route.get('/login', function (req, res) {
        var fmsg = req.flash();
        var feedback = '';
        if (fmsg.error) {
            feedback = fmsg.error[0];
        }
        res.render('login', { flash: feedback });
    });
    route.post('/login', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true,
    }));
    route.get('/new', function (req, res) {
        if (req.user) {
            console.log('로그인 상태입니다.');
            res.redirect('/');
        } else {
            res.render('new');
        }
    });
    route.post('/new', function (req, res) {
        var id = req.body.email;
        var pwd = req.body.pwd;
        var name = req.body.name;
        var age = req.body.age;
        mongoose.addUser(id, pwd, name, age, function (err, result) {
            if (err) {
                console.log('회원가입 중 에러 발생');
                res.redirect('/new');
                return;
            }
            res.redirect('/login');
        });
    });

    route.get('/facebook', passport.authenticate('facebook'));
    route.get('/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/login'
    }));
    route.get('/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));
    route.get('/google/callback', passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/login'
    }));
    route.get('/naver', passport.authenticate('naver'));
    route.get('/naver/callback', passport.authenticate('naver', {
        successRedirect: '/',
        failureRedirect: '/login'
    }));
    route.get('/logout', function (req, res) {
        if (req.user) {
            req.logout();
            req.session.save(function (err) {
                if (err) {
                    console.log('로그아웃 중 에러 발생');
                    res.redirect('/');
                    return;
                }
                console.log('세션 삭제 완료');
                res.redirect('/');
            });
        } else {
            console.log('로그인 상태가 아닙니다.');
            res.redirect('/');
        }
    });
    return route;
}

