var multer = require('multer');  
var upload_file_name = ext = '';

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



var upload = multer({ storage: storage });

// app/routes.js
module.exports = function(app, passport) { 
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
    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });
   // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

};