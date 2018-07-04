var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
app.set('port', process.env.PORT || 3000);
app.set('views', './views');
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({ extended: false }));
app.locals.pretty = true;

app.get('/',function(req,res){
    res.render('main');
})

app.listen(app.get('port'), function () {
    console.log("Server Connecting is Success with: ", app.get('port'));
})