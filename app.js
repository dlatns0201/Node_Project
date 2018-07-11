var express=require('express');
var fs=require('fs');
var bodyParser=require('body-parser');
var app=express();
var fs=require('fs');
app.locals.pretty=true;
app.set('port',process.env.PORT || 3000);
app.set('views','./views');
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('public'));
app.get('/',function(req,res){
    res.render('index');
})
app.get('/login', function(req,res){
    res.render('login');
})
app.get('/intro',function(req,res){
    res.render('intro');
})
app.get('/new',function(req,res){
    res.render('new');
})
app.post('/',function(req,res){
    var id=req.body.id;
    var pwd=req.body.pwd;
    fs.readdir('views/data',function(err,files){
        if(err){
            res.status(500).send('잘못된 파일로드 입니다.');
        }
        fs.readFile('views/data/'+id,'utf8',function(err,data){
            if(err){
                res.status(500).send('잘못된 회원 ID입니다.');
            }
            else if(data!=pwd){
                res.status(500).send('잘못된 회원 PWD입니다.');
            }
            res.render('index',{user: id});
        });

    });
})
app.post('/login',function(req,res){
    var id=req.body.new_id;
    var pwd=req.body.new_pwd;
    fs.writeFile('views/data/'+id,pwd,function(err){
        if(err){
            res.send('데이터가 저장하는 경로가 없습니다');
        }
        res.render('login');
    });
})

app.listen(app.get('port'),function(){
    console.log('Success Connected: '+app.get('port'));
})
