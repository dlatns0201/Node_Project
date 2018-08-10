var route=require('express').Router();
route.get('/', function (req, res) {
  if (req.user) {
      res.render('index', { user: req.user.name });
  }
  else {
      res.render('index');
  }
})
route.get('/intro', function (req, res) {
  if (req.user) {
      res.render('intro', { user: req.user.name });
  }
  else {
      res.redirect('/');
  }
});
module.exports=route;
