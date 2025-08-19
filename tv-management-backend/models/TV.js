const mongoose = require('mongoose');

const tvSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: String,
  location: String,
  ipAddress: String,

  // ADD: online status tracking
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  lastSeen: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('TV', tvSchema);