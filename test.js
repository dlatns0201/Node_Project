var express=require('express');
var app=express();
app.set('port',process.env.PORT || 3000);
app.get('/',function(req,res){
	res.send('Hi my first node js project test');
});
app.listen(app.get('port'),function(){
	console.log('Success Connecting!: '+app.get('port'));
});
