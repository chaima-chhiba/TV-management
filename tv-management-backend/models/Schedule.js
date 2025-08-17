const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  tvId: { type: mongoose.Schema.Types.ObjectId, ref: 'TV', required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
  daysOfWeek: { type: [Number], default: [0,1,2,3,4,5,6] }, // 0=Sun..6=Sat
  startTime: { type: String, default: '00:00' }, // 'HH:mm'
  endTime: { type: String, default: '23:59' },   // 'HH:mm'
  startDate: { type: Date }, // optional date window start (inclusive)
  endDate: { type: Date },   // optional date window end (inclusive)
  timezone: { type: String, default: 'UTC' },
  enabled: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);