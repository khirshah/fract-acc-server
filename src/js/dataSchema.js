var db = require('./mongo');

var Schema = db.Schema;

// create a schema
var dataSchema = new Schema({
  "DATE_ID":Number,
  "CURRENCY": String,
  "AMOUNT": { type: Number },
  "PROJ": { type: Number, required: true },
  "GBP": Number,
  "TRANS_TYPE": String,
  "TRANS_DATE": Date,
  "TRANS_REF": String,
  "TRANS_DESC": String,
  "XCH_USD_GBP": Number,
  "XCH_GBP_USD": Number,
  "INVOICE_XCH_RATE": Number

});

// on every save, add the date
dataSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();

  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  next();
});

// custom method to add string to end of name
// you can create more important methods like name validations or formatting
// you can also do queries and find similar users 
/*userSchema.methods.dudify = function() {
  // add some stuff to the users name
  this.name = this.name + '-dude'; 
  return this.name;
};*/


// the schema is useless so far
// we need to create a model using it
var dataRow = db.model('DATA', dataSchema);

// make this available to our users in our Node applications
module.exports = dataRow;

