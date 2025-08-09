const mongoose = require('mongoose');

const tvSchema = new mongoose.Schema({
  name: String,
  department: String,
 profileName: String,
 
});

module.exports = mongoose.model('TV', tvSchema);
