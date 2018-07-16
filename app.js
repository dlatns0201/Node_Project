var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var bkfd2Password = require('pbkdf2-password');
var hasher = bkfd2Password();
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').strategy;
app.locals.pretty = true;
app.set('port', process.env.PORT || 3000);
app.set('views', './views');
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({
    secret: '1q2w3e4r',
    resave: false,
    saveUninitialized: true,
    store: new FileStore()
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function (req, res) {
    if (req.session.username) {
        res.render('index', { user: req.session.username });
    }
    else {
        res.render('index');
    }
})
app.get('/login', function (req, res) {
    res.render('login');
})
app.get('/logout', function (req, res) {
    delete req.session.username;
    return req.session.save(function(){
        res.redirect('/');
    });
})
app.get('/intro', function (req, res) {
    res.render('intro');
})
app.get('/new', function (req, res) {
    res.render('new');
})
app.post('/login', function (req, res) {
    var id = req.body.username;
    var pwd = req.body.password;
    fs.readdir('views/data', function (err, files) {
        if (err) { //디렉토리가 없읅 영우
            res.status(500).send('잘못된 파일로드 입니다.');
        }
        fs.readFile('views/data/' + id, 'utf8', function (err, data) {
            if (err) { //id 즉 파일이 없을 경우
                res.status(500).send('잘못된 회원 ID입니다.');
            }
            var p = '';
            var salt = '';
            for (var i = 0; data[i - 1] != ','; i++) {
                if (data[i] == ',') {
                    for (var j = i + 1; data[j] != null; j++) {
                        salt += data[j];
                    }
                }
                else {
                    p += data[i];
                }
            };
            hasher({ password: pwd, salt: salt }, function (err, pass, salt, hash) {
                if (p==hash) {
                    req.session.username = id;
                    return req.session.save(function () {
                        res.redirect('/');
                    });
                }
                else{
                    res.send("잘못된 패스워드 입니다.");
                }
            });
        });
    });
});
app.post('/new', function (req, res) {
    hasher({ password: req.body.password }, function (err, pass, salt, hash) {
        var user = [hash, salt];
        fs.writeFile('views/data/' + req.body.username, user, function (err) {
            if (err) {
                res.send('데이터를 저장할 디렉토리가 없습니다');
            }
            else {
                req.session.username = req.body.username;
                return req.session.save(function () {
                    res.redirect('/');
                });
            }
        });
    });
});

app.listen(app.get('port'), function () {
    console.log('Success Connected: ' + app.get('port'));
})
