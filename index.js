var app = require("express")();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var im = require('imagemagick');
var ip = require("ip");
var port =  process.env.PORT || 8888;

var config = require('./config/config');
var bodyParser = require("body-parser");
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var session = require('express-session');

//passport code goes here
var passport = require('passport');
// require('./config/passport')(passport); 
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

var ips = [];
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/public/views');
var User = require('./config/User');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(config.DbUri);
app.set('view engine', 'html');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

//including models
var User = mongoose.model('User');




var url = config.DbUri;
var sess = {}; var username;
app.use(session({secret: 'thisisasecret'}));




app.use(express.static(__dirname + '/public'));


require('./app/routes/routes.js')(app, passport);
/*
  Socket Code Goes here
 */
io.on('connection',function(socket){
    console.log('A User connected');
    socket.on("disconnect",function(){
        console.log('a user is disconnected');
    });
  socket.on('send', function(msg){
        function addZero(i) {
         if (i < 10) {
             i = "0" + i;
         }
         return i;
     }

     function currentTime() {
         var d = new Date();        
         var h = addZero(d.getHours());
         var m = addZero(d.getMinutes());      
        return  h + ":" + m;
     }
         MongoClient.connect(url, function (err, db) {
            if (err) {
              console.log('Unable to connect to the mongoDB server. Error:', err);
            } else {
               var collection = db.collection('chat');   
               var chat = {username: username, message: msg, timestamp:currentTime(),ip:ip.address()};
                  collection.insert([chat], function (err, result) {
                              if (err) {
                               console.log(err);
                            } else {
                              console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', result.length, result);
                            }
                  });
              //Close connection
              db.close();
            }
          });
    io.emit('send', {msg:msg,username:username,time:currentTime()});
  });
  socket.on('file_upload', function(msg){
    io.emit('file_upload', msg);
  });
});

//start the server
http.listen(port,function(){
    console.log('listing at '+port);
});