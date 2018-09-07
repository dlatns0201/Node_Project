var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var flash = require('connect-flash');
var mongoSession=require('connect-mongo')(session);
var app = express();

app.locals.pretty = true;
app.set('port', process.env.PORT || 3000);
app.set('views', './views');
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(session({
    secret: '1q2w3e4r',
    resave: false,
    saveUninitialized: true,
    store: new mongoSession({
        url:"mongodb://localhost:27017/local"
    })
}));
app.use(flash());
module.exports = app;