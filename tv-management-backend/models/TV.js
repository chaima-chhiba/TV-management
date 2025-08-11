const mongoose = require('mongoose');

const tvSchema = new mongoose.Schema({
  name: String,
  department: String,
  
displayKey: { type: String, unique: true },
  profiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }] 
});

module.exports = mongoose.model('TV', tvSchema);