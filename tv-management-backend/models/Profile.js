const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['text', 'image', 'video'], required: true },
  content: String,     // for text
  url: String,         // external media URL
  layout: { type: String, enum: ['fullscreen', 'split2', 'split4'], default: 'fullscreen' },
  tv: { type: mongoose.Schema.Types.ObjectId, ref: 'TV' },
  media: {
    data: Buffer,
    contentType: String
  },
  duration: { type: Number, default: 8 }
}, { timestamps: true });

profileSchema.set('toJSON', {
  transform: (_doc, ret) => {
    if (ret.media?.data && ret.media?.contentType) {
      try {
        const b64 = Buffer.from(ret.media.data).toString('base64');
        ret.mediaDataUrl = `data:${ret.media.contentType};base64,${b64}`;
      } catch {}
    }
    if (ret.media?.data) delete ret.media.data; // drop heavy buffer from JSON
    return ret;
  }
});

module.exports = mongoose.model('Profile', profileSchema);