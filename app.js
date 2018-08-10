var app = require('./lib/express');
var passport=require('./lib/passport')(app);
var mongoose=require('./lib/db');
var authRoute=require('./routes/auth')(passport);
var indexRoute=require('./routes/index');

app.use(authRoute);
app.use(indexRoute);

app.all('*', function (req, res) {
    res.render('error');
});
app.listen(app.get('port'), function () {
    console.log('Success Connected: ' + app.get('port'));
    mongoose.connectDB();
});
