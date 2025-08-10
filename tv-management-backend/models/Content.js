const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['text', 'image', 'video'], required: true },
  url: String,
  layout: { type: String, enum: ['fullscreen', 'split2', 'split4'], required: true },
  target: { type: String, required: true } // department or specific TV
});

module.exports = mongoose.model('Content', contentSchema);