var app = require('./lib/express');
var passport = require('./lib/passport')(app);
var mongoose = require('./lib/db');
var authRoute = require('./routes/auth')(passport);
var indexRoute = require('./routes/index');
var os = require('os');
var cluster = require('cluster');

if (cluster.isMaster) {
    os.cpus().forEach(function () {
        cluster.fork();
    })
    cluster.on('exit', function (worker, code, signal) {
        console.log(worker.id + " 가 죽었습니다.");
        if (code == 200) {
            cluster.fork();
        }
    });
    cluster.workers[1].send({ type: "ServerOpen", from: "master" });
}
else {
    app.use(authRoute);
    app.use(indexRoute);

    app.all('*', function (req, res) {
        res.render('error');
    });
    process.on("message", function (message) {
        if (message.type == "ServerOpen") {
            app.listen(app.get('port'), function () {
                console.log('Success Connected: ' + app.get('port'));
                mongoose.connectDB();
            });
        }
    });
}
