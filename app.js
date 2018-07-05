var express=require('express');
var fs=require('fs');
var bodyParser=require('body-parser');
var app=express();
app.locals.pretty=true;
app.set('port',process.env.PORT || 3000);
app.set('views','./views');
app.set('view engine', 'jade');
app.get('/',function(req,res){
    res.render('index');
})
app.get('/intro',function(req,res){
    res.render('intro');
})
app.listen(app.get('port'),function(){
    console.log('Success Connected: '+app.get('port'));
})
