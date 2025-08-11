const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  title: { type: String, required: true }, 
  description: String,
  type: { type: String, enum: ['text', 'image', 'video'], required: true }, 
  url: String,
  layout: { type: String, enum: ['fullscreen', 'split2', 'split4'], required: true }, 
  tv: { type: mongoose.Schema.Types.ObjectId, ref: 'TV' }, 
});

module.exports = mongoose.model('Profile', profileSchema);