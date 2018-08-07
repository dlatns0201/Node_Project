var express = require('express');
var fs = require('fs');
var mongoose = require('mongoose');
var crypto = require('crypto');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var flash = require('connect-flash');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var facebookStrategy = require('passport-facebook').Strategy;
var googleStrategy = require('passport-google-oauth20').Strategy;
var naverStrategy = require('passport-naver');
var app = express();
var database, UserSchema, UserModel;

app.locals.pretty = true;
app.set('port', process.env.PORT || 3000);
app.set('views', './views');
app.set('view engine', 'jade');

function connectDB() {
    var Dburl = 'mongodb://localhost:27017/local';
    mongoose.connect(Dburl);
    database = mongoose.connection;

    database.on('error', console.error.bind(console, 'mongoose connection error!'));
    database.on('open', function () {
        console.log('데이터베이스 연결 중입니다.');
        UserSchema = mongoose.Schema({
            id: { type: String, unique: true },
            authID: { type: String, required: true, unique: true },
            salt: { type: String },
            hashed_password: { type: String },
            name: { type: String, 'default': 'guest' },
            age: { type: Number, 'default': 0 }
        });
        UserSchema.virtual('password').set(function (password) {
            this._password = password;
            this.salt = this.makeSalt();
            this.hashed_password = this.encrypto(password);
            console.log('virtual password가 호출됨.');
        }).get(function () { return this._password });
        UserSchema.static('findById', function (id, callback) {
            return this.findOne({ "id": id }, callback);
        });
        UserSchema.static('findAll', function (callback) {
            return this.find({}, callback);
        });
        UserSchema.method('makeSalt', function () {
            return Math.round(new Date().valueOf * Math.random());
        });
        UserSchema.method('encrypto', function (input, insalt) {
            if (insalt) {
                return crypto.createHmac('sha1', insalt).update(input).digest('hex');
            } else {
                return crypto.createHmac('sha1', this.salt).update(input).digest('hex');
            }
        });
        UserSchema.method('authenticate', function (input, insalt, hashed_password) {
            if (insalt) {
                return this.encrypto(input, insalt) === hashed_password;
            } else {
                return this.encrypto(input) === this.hashed_password;
            }
        });
        UserModel = mongoose.model('blogusers', UserSchema);
    });
    database.on('disconnected', function () {
        console.log('데이터베이스 연결이 끊어졌습니다. 다시 연결 시도 중');
        connectDB();
    })
}
function authUser(db, id, pwd, callback) {
    UserModel.findById(id, function (err, result) {
        if (err) {
            callback(err, null);
            return;
        }
        if (result.length > 0) {
            console.log('아이디가 일치합니다.');
            var user = new UserModel({ "id": id });
            var authenticated = user.authenticate(pwd, result[0]._doc.salt, result[0]._doc.hashed_password);
            if (authenticated) {
                console.log('비밀번호가 일치합니다.');
                callback(null, result);
            } else {
                console.log('비밀번호가 일치하지 않습니다.');
                callback(null, null);
            }
        } else {
            console.log('아이디가 일치하지 않습니다.');
            callback(null, null);
        }
    });
}
function addUser(db, id, pwd, name, age, callback) {
    var user = new UserModel({ "id": id, "authID": 'local: ' + id, "password": pwd, "name": name, "age": age });
    user.save(function (err) {
        if (err) {
            console.log('사용자 추가 중 에러 발생');
            return;
        }
        console.log('사용자 데이터가 추가됨, 사용자: ' + name);
        callback(null, user);
    });
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(session({
    secret: '1q2w3e4r',
    resave: false,
    saveUninitialized: true,
    store: require('mongoose-session')(mongoose)
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
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
                callback(null, result);
            } else {
                console.log('비밀번호가 틀립니다.');
                callback(null, false, { message: 'Incorrect Password!!' });
            }
        } else {
            console.log('해당 이메일이 존재하지 않습니다.');
            callback(null, false, { message: 'Incorrect ID!!' });
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

app.get('/', function (req, res) {
    if (req.user) {
        res.render('index', { user: req.user.name });
    }
    else {
        res.render('index');
    }
})
app.get('/login', function (req, res) {
    res.render('login');
});
app.get('/facebook', passport.authenticate('facebook'));
app.get('/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/login'
}));
app.get('/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));
app.get('/google/callback', passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login'
}));
app.get('/naver', passport.authenticate('naver'));
app.get('/naver/callback', passport.authenticate('naver', {
    successRedirect: '/',
    failureRedirect: '/login'
}));
app.get('/logout', function (req, res) {
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
app.get('/intro', function (req, res) {
    if (req.user) {
        res.render('intro', { user: req.user.name });
    }
    else {
        res.redirect('/');
    }
});
app.get('/new', function (req, res) {
    if (req.user) {
        console.log('로그인 상태입니다.');
        res.redirect('/');
    } else {
        res.render('new');
    }
});
app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
}));
app.post('/new', function (req, res) {
    if (database) {
        var id = req.body.email;
        var pwd = req.body.pwd;
        var name = req.body.name;
        var age = req.body.age;
        addUser(database, id, pwd, name, age, function (err, result) {
            if (err) {
                console.log('회원가입 중 에러 발생');
                res.redirect('/new');
                return;
            }
            res.redirect('/login');
        });
    } else {
        console.log('데이터베이스 연결이 안되어 있습니다.');
        res.redirect('/new');
    }
});
app.all('*', function (req, res) {
    res.render('error');
});
app.listen(app.get('port'), function () {
    console.log('Success Connected: ' + app.get('port'));
    connectDB();
});
