var app = require("express")();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var multer = require('multer');  
var upload_file_name = ext = '';
var im = require('imagemagick');
var ip = require("ip");
var port =  process.env.PORT || 8888;
var cloudinary = require('cloudinary');
var config = require('./config/config');
var bodyParser = require("body-parser");
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var session = require('express-session');
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

cloudinary.config({
  cloud_name: config.cloudinaryName, 
  api_key: config.cloudinaryKey, 
  api_secret:config.cloudinarySecret,  
});


var url = config.DbUri;
var sess = {}; var username;
app.use(session({secret: 'thisisasecret'}));


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/upload/')
    },
    filename: function (req, file, cb) {
        var file_data =  file.originalname.split(".");
         ext = file_data[file_data.length-1];
        var name_of_file = file_data[file_data.length-2];
         upload_file_name = name_of_file + '-' + Date.now()+"."+ext;
        cb(null, upload_file_name)
    }
});


app.use(express.static(__dirname + '/public'));
var upload = multer({ storage: storage });
app.post('/upload', upload.single('image'), function (req, res) {  
         cloudinary.uploader.upload(req.file.path, function(result) { 
        var url_upload_image =result.secure_url;
        ext = result.format;
        console.log(result);
    });
    var resObj = {origianl:req.file.originalname,uploaded:upload_file_name,ext:ext};
    res.send(JSON.stringify(resObj));
});

app.post("/",function(req,res){
   username  =req.body.name; 
   console.log(username,'----------');
   sess = req.session;
   sess.username = username;
   var currentIp = ip.address() ;
    MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
     var collection = db.collection('users');   
    var user1 = {name: username, ip: currentIp, roles: [ 'user']};
        collection.insert([user1], function (err, result) {
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

   res.render('index',{name:username});  
});

app.post("/getchat",function(req,res){
      MongoClient.connect(url, function (err, db) {
        if (err) {
          console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
          //HURRAY!! We are connected. :)
          console.log('Connection established to', url);
           var collection = db.collection('chat');    
           collection.find().sort({_id:1}).limit(50).toArray(function (err, result) {
            if (err) {
              console.log(err);
            } else if (result.length) {
                  var result = {result:true,data:result};
                  res.send(JSON.stringify(result));
            } else {
                  var result = {result:false};
                  res.send(JSON.stringify(result));
            }
            //Close connection
            db.close();
          });
        }
      });
});

app.get("/",function(req,res){
    var currentIp = ip.address() ;
   MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);
     var collection = db.collection('users');    
     collection.find({ip: currentIp}).toArray(function (err, result) {
      if (err) {
        console.log(err);
      } else if (result.length) {
        username = result[0].name;
        res.render('index',{name:result[0].name});
      } else {
         res.render('addname');
      }
      //Close connection
      db.close();
    });
  }
});
});

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