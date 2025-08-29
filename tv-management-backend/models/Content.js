const mongoose = require('mongoose');
const { Schema } = mongoose;

const AssetSchema = new Schema({
  // give assets their own _id (remove _id:false if you had it)
  type: { type: String, enum: ['text','image','video'], required: true },
  title: String,
  url: String,
  filePath: String,
  media: { data: Buffer, contentType: String },
  duration: { type: Number, default: 8 }
}); // NOTE: no { _id:false } here

const ContentSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['text','image','video'], required: true },
  layout: { type: String, enum: ['auto','fullscreen','split2','split4'], default: 'auto' },
  tv: { type: Schema.Types.ObjectId, ref: 'TV', default: null },
  tvs: [{ type: Schema.Types.ObjectId, ref: 'TV' }],
  profile: { type: Schema.Types.ObjectId, ref: 'Profile', default: null },
  content: String,
  url: String,
  media: { data: Buffer, contentType: String },
  assets: [AssetSchema],
  duration: { type: Number, default: 8 }
}, { timestamps: true });

ContentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    if (ret.media?.data && ret.media?.contentType) {
      try { ret.mediaDataUrl = `data:${ret.media.contentType};base64,${Buffer.from(ret.media.data).toString('base64')}`; } catch {}
    }
    if (ret.media?.data) delete ret.media.data;
    if (Array.isArray(ret.assets)) {
      ret.assets = ret.assets.map(a => {
        const copy = { ...a };
        if (copy.media?.data && copy.media?.contentType) {
          try { copy.mediaDataUrl = `data:${copy.media.contentType};base64,${Buffer.from(copy.media.data).toString('base64')}`; } catch {}
        }
        if (copy.media?.data) delete copy.media.data;
        return copy;
      });
    }
    return ret;
  }
});

module.exports = mongoose.model('Content', ContentSchema);