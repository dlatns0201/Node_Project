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
var users = [];
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
app.get('/logout',function(req,res){
    delete req.session.username;
    res.redirect('/');
})
app.get('/intro', function (req, res) {
    res.render('intro');
})
app.get('/new', function (req, res) {
    res.render('new');
})
app.post('/login', function (req, res) {
    var id = req.body.id;
    var pwd = req.body.pwd;
    for(var i=0; i<users.length; i++)
    {
        user=users[i];
        if(id==user.id && pwd==user.pwd){
            req.session.username=user.id;
            return req.session.save(function(){
                res.redirect('/');
            });
        }
    }
});
app.post('/new', function (req, res) {
    var user = {
        id: req.body.new_id,
        pwd: req.body.new_pwd
    };
    users.push(user);
    req.session.username = req.body.new_id;
    req.session.save(function () {
        res.redirect('/');
    });
});

app.listen(app.get('port'), function () {
    console.log('Success Connected: ' + app.get('port'));
})
