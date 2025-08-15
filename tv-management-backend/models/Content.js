const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['text', 'image', 'video'], required: true },
  content: String,
  url: String,
  layout: { type: String, enum: ['fullscreen', 'split2', 'split4'], required: true },
  tv: { type: mongoose.Schema.Types.ObjectId, ref: 'TV' },
  profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  media: {
    data: Buffer,
    contentType: String
  },
  duration: { type: Number, default: 8 }
}, { timestamps: true });

contentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    if (ret.media && ret.media.data && ret.media.contentType) {
      try {
        const b64 = Buffer.from(ret.media.data).toString('base64');
        ret.mediaDataUrl = `data:${ret.media.contentType};base64,${b64}`;
      } catch (_) {}
    }
    if (ret.media && ret.media.data) delete ret.media.data; // keep payload small
    return ret;
  }
});

module.exports = mongoose.model('Content', contentSchema);