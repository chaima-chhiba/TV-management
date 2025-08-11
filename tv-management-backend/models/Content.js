const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['text', 'image', 'video'], required: true },
  content: String,          // text body when type = text
  url: String,              // optional external URL
  layout: { type: String, enum: ['fullscreen', 'split2', 'split4'], required: true },
  tv: { type: mongoose.Schema.Types.ObjectId, ref: 'TV' },
  profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  // Embedded media (base64 -> Buffer)
  media: {
    data: Buffer,
    contentType: String
  }
}, { timestamps: true });

// Include data URL when converting to JSON
contentSchema.set('toJSON', {
  transform: (_, doc) => {
    if (doc.media?.data) {
      doc.mediaDataUrl = `data:${doc.media.contentType};base64,${doc.media.data.toString('base64')}`;
    }
    delete doc.media?.data; // keep raw buffer out (optional)
    return doc;
  }
});

module.exports = mongoose.model('Content', contentSchema);