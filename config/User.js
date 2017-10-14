var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var User = new Schema({
  name: { id: ObjectId,type: String, default: 'User' },
 
});

mongoose.model('User', User);
