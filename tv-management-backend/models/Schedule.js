const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  tvId: { type: mongoose.Schema.Types.ObjectId, ref: 'TV' },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  startTime: Date,
  endTime: Date
});

module.exports = mongoose.model('Schedule', scheduleSchema);