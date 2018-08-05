var express = require('express');
var fs = require('fs');
var mongoose = require('mongoose');
var crypto = require('crypto');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').strategy;
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
            id: { type: String, required: true, unique: true },
            salt: { type: String, required: true },
            hashed_password: { type: String, required: true },
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
            return this.find({ "id": id }, callback);
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
                return this.encrypto(input, insalt) == hashed_password;
            } else {
                return this.encrypto(input) == this.hashed_password;
            }
        });
        UserModel = mongoose.model('bloguser', UserSchema);
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
    var user = new UserModel({ "id": id, "password": pwd, "name": name, "age": age });
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
    store: new FileStore({ logFn: function () { } })
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function (req, res) {
    if (req.session.user) {
        res.render('index', { user: req.session.user.name });
    }
    else {
        res.render('index');
    }
})
app.get('/login', function (req, res) {
    res.render('login');
})
app.get('/logout', function (req, res) {
    if (req.session.user) {
        return req.session.destroy(function (err) {
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
})
app.get('/intro', function (req, res) {
    if (req.session.user) {
        res.render('intro', { user: req.session.user.name });
    }
    else {
        res.render('intro');
    }
});
app.get('/new', function (req, res) {
    if (req.session.user) {
        console.log('로그인 상태입니다.');
        res.redirect('/');
    } else {
        res.render('new');
    }
});
app.post('/login', function (req, res) {
    if (database) {
        var id = req.body.username;
        var pwd = req.body.password;
        authUser(database, id, pwd, function (err, result) {
            if (err) {
                console.log('로그인 중 오류 발생');
                res.redirect('/login');
                return;
            }
            if (result) {
                if (!req.session.user) {
                    req.session.user = {
                        id: id,
                        name: result[0]._doc.name
                    };
                }
                return req.session.save(function (err) {
                    if (err) {
                        console.log('세션 저장 중 오류 발생');
                        res.redirect('/login');
                        return;
                    }
                    console.log('세션 생성 완료');
                    res.redirect('/');
                });
            } else {
                console.log('로그인 실패');
                res.redirect('/login');
            }
        });
    } else {
        console.log('데이터베이스 연결이 안 되어 있습니다.');
        res.redirect('/login');
    }
});
app.post('/new', function (req, res) {
    if (database) {
        var id = req.body.username;
        var pwd = req.body.password;
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
