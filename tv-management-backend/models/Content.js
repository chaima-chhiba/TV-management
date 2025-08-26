const mongoose = require('mongoose');
const { Schema } = mongoose;

const ContentSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['text','image','video'], required: true },
  layout: { type: String, enum: ['auto','fullscreen','split2','split4'], default: 'auto' },
  tv: { type: Schema.Types.ObjectId, ref: 'TV', default: null },     // legacy single
  tvs: [{ type: Schema.Types.ObjectId, ref: 'TV' }],                 // NEW: multiple
  content: String,
  url: String,
  media: { data: Buffer, contentType: String }
}, { timestamps: true });

// Keep tv/tvs in sync
ContentSchema.pre('save', function(next) {
  if (this.tvs?.length && !this.tv) this.tv = this.tvs[0];
  if ((!this.tvs || this.tvs.length === 0) && this.tv) this.tvs = [this.tv];
  next();
});

module.exports = mongoose.model('Content', ContentSchema);