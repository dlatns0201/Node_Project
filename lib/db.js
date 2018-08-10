var mongoose = require('mongoose');
var crypto = require('crypto');
var database, UserSchema, UserModel;

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

function connectDB() {
    var Dburl = 'mongodb://localhost:27017/local';
    mongoose.connect(Dburl);
    database = mongoose.connection;
    database.on('error', console.error.bind(console, 'mongoose connection error!'));
    database.on('open', function () {
        console.log('데이터베이스 연결 중입니다.');
        
    });
    database.on('disconnected', function () {
        console.log('데이터베이스 연결이 끊어졌습니다. 다시 연결 시도 중');
        connectDB();
    });
}
function authUser(id, pwd, callback) {
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
function addUser(id, pwd, name, age, callback) {
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
module.exports={
    UserModel:UserModel,
    connectDB:function(){
        connectDB();
    },
    authUser:function(id,pwd,callback){
        authUser(id,pwd,callback);
    },
    addUser:function(id,pwd,name,age,callback){
        addUser(id,pwd,name,age,callback);
    }
}