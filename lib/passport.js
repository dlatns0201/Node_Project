module.exports = function (app) {
    var passport = require('passport');
    var localStrategy = require('passport-local').Strategy;
    var facebookStrategy = require('passport-facebook').Strategy;
    var googleStrategy = require('passport-google-oauth20').Strategy;
    var naverStrategy = require('passport-naver');
    var UserModel=require('./db').UserModel;

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, callback) => {
        return callback(null, user.authID);
    });
    passport.deserializeUser((id, callback) => {
        UserModel.findOne({ "authID": id }, (err, result) => {
            return callback(null, result);
        });
    });
    passport.use(new localStrategy({
        usernameField: 'email',
        passwordField: 'pwd',
        session: true
    }, (id, pwd, callback) => {
        UserModel.findById(id, (err, result) => {
            if (err) {
                console.log('로그인 중 에러 발생');
                return callback(err);
            }
            if (result) {
                console.log('해당 이메일이 존재합니다.');
                var user = new UserModel({ "id": id });
                var authenticated = user.authenticate(pwd, result.salt, result.hashed_password);
                if (authenticated) {
                    console.log('비밀번호가 일치합니다.');
                    return callback(null, result);
                } else {
                    console.log('비밀번호가 틀립니다.');
                    return callback(null, false, { message: 'Incorrect Password!!' });
                }
            } else {
                console.log('해당 이메일이 존재하지 않습니다.');
                return callback(null, false, { message: 'Incorrect ID!!' });
            }
        });
    }))
    passport.use(new facebookStrategy({
        clientID: '394651704393934',
        clientSecret: '519f94938c8908c7bda27453811eee65',
        callbackURL: '/facebook/callback'
    }, (accessToken, refreshToken, profile, callback) => {
        var authID = 'facebook: ' + profile.id;
        UserModel.findAll((err, result) => {
            if (err) {
                console.log('페이스북 인증 도중 사용자 조회 에러 발생');
                callback(err);
                return;
            }
            for (var i = 0; i < result.length; i++) {
                if (result[i].authID == authID) {
                    console.log('데이터베이스에 사용자 정보가 있습니다.');
                    return callback(null, result[i]);
                }
            }
            var newuser = new UserModel({ "authID": authID, "name": profile.displayName });
            newuser.save((err) => {
                if (err) {
                    console.log('페이스북 인증 후 사용자 추가 도중 에러 발생');
                    return;
                }
                console.log('사용자 데이터 추가 완료');
                callback(null, newuser);
            });
        });
    }));
    passport.use(new googleStrategy({
        clientID: '817069988625-8fd128tff0lfhlfcggtol1aoh81actac.apps.googleusercontent.com',
        clientSecret: 'mPn1JEoDo4qYtOyFbxp6jm4o',
        callbackURL: '/google/callback'
    }, (token, tokenSecret, profile, callback) => {
        var authID = 'google: ' + profile.id;
        UserModel.findAll((err, result) => {
            if (err) {
                console.log('구글 인증 도중 사용자 조회 에러 발생');
                callback(err);
                return;
            }
            for (var i = 0; i < result.length; i++) {
                if (result[i].authID == authID) {
                    console.log('데이터베이스에 사용자 정보가 있습니다.');
                    return callback(null, result[i]);
                }
            }
            var newuser = new UserModel({ "authID": authID, "name": profile.displayName });
            newuser.save((err) => {
                if (err) {
                    console.log('구글 인증 후 사용자 추가 도중 에러 발생');
                    return;
                }
                console.log('사용자 데이터 추가 완료');
                callback(null, newuser);
            });
        });
    }));
    passport.use(new naverStrategy({
        clientID: 'QcTOQPiG5o7niR9fDB1L',
        clientSecret: 'fTXS2k7o4I',
        callbackURL: '/naver/callback'
    }, (accessToken, refreshToken, profile, callback) => {
        var authID = 'naver: ' + profile.id;
        UserModel.findAll((err, result) => {
            if (err) {
                console.log('네이버 인증 도중 사용자 조회 에러 발생');
                callback(err);
                return;
            }
            for (var i = 0; i < result.length; i++) {
                if (result[i].authID == authID) {
                    console.log('데이터베이스에 사용자 정보가 있습니다.');
                    return callback(null, result[i]);
                }
            }
            var newuser = new UserModel({ "authID": authID, "name": profile.displayName });
            newuser.save((err) => {
                if (err) {
                    console.log('네이버 인증 후 사용자 추가 도중 에러 발생');
                    return;
                }
                console.log('사용자 데이터 추가 완료');
                callback(null, newuser);
            });
        });
    }));
    return passport;
}