const Content = require('../models/Content');
let Schedule;
try { Schedule = require('../models/Schedule'); } catch { /* optional */ }
const mongoose = require('mongoose');

function normalizeAssets(raw = []) {
  return (Array.isArray(raw) ? raw : []).map(a => {
    const fromMime = a.fileMime?.startsWith('video/') ? 'video'
      : (a.fileMime?.startsWith('image/') ? 'image' : '');
    const fromPath = /\.(mp4|webm|ogg)$/i.test(a.url || a.filePath || '') ? 'video'
      : (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(a.url || a.filePath || '') ? 'image' : '');
    const out = {
      type: a.type || fromMime || fromPath || 'image',
      title: a.title || a.name || '',
      duration: Number(a.duration) > 0 ? Number(a.duration) : 8
    };
    // preserve existing url/filePath if no new upload
    if (a.fileBase64 && a.fileMime) {
      out.media = { data: Buffer.from(a.fileBase64, 'base64'), contentType: a.fileMime };
    } else if (a.url) {
      out.url = a.url;
    } else if (a.filePath) {
      out.filePath = a.filePath;
    }
    return out;
  });
}

// CREATE
exports.createContent = async (req, res) => {
  try {
    const b = req.body;
    const tvs = Array.isArray(b.tvs) ? b.tvs : (b.tv ? [b.tv] : []);
    const assets = Array.isArray(b.assets) ? normalizeAssets(b.assets) : [];

    const created = await Content.create({
      title: b.title,
      description: b.description,
      type: b.type,
      layout: b.type === 'text' ? 'auto' : (b.layout || 'auto'),
      tv: tvs[0] || null,
      tvs,
      profile: b.profile || null,
      content: b.type === 'text' ? b.content : undefined,
      url: b.type !== 'text' ? b.url : undefined,
      assets
    });

    // Optional schedule
    if (Schedule && b.schedule?.enabled && tvs.length) {
      const s = b.schedule;
      await Promise.all(tvs.map(tvId =>
        Schedule.findOneAndUpdate(
          { tvId, contentId: created._id },
          {
            tvId, contentId: created._id,
            daysOfWeek: Array.isArray(s.daysOfWeek) ? s.daysOfWeek : [0,1,2,3,4,5,6],
            startTime: s.startTime || '00:00',
            endTime: s.endTime || '23:59',
            startDate: s.startDate || null,
            endDate: s.endDate || null,
            timezone: s.timezone || 'UTC',
            enabled: true
          },
          { upsert: true, new: true }
        )
      ));
    }

    return res.status(201).json(created);
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }
};

exports.getAllContent = async (req, res) => {
  const contents = await Content.find();
  res.json(contents);
};

// ADD: public, read-only content list for Display
exports.getContentsPublic = async (req, res) => {
  try {
    const items = await Content.find({}, '-__v').sort({ createdAt: 1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// UPDATE
exports.updateContent = async (req, res) => {
  try {
    const b = req.body;
    const contentId = req.params.id;
    const current = await Content.findById(contentId);
    if (!current) return res.status(404).json({ error: 'Not found' });

    const tvs = Array.isArray(b.tvs) ? b.tvs
      : (b.tv ? [b.tv] : (current.tvs?.length ? current.tvs : (current.tv ? [current.tv] : [])));

    const update = {
      title: b.title,
      description: b.description,
      type: b.type,
      layout: b.type === 'text' ? 'auto' : (b.layout || 'auto'),
      tv: tvs[0] || null,
      tvs,
      profile: b.profile || null,
      content: b.type === 'text' ? b.content : undefined,
      url: b.type !== 'text' ? b.url : undefined
    };

    // Only replace assets if client truly sends a replacement list
    if (Array.isArray(b.assets) && b.assets.length > 0) {
      update.assets = normalizeAssets(b.assets);
      update.$unset = { media: 1 };
    } else if (b.clearAssets === true) {
      update.assets = [];
      update.$unset = { media: 1 };
    }

    // First update base fields
    await Content.updateOne({ _id: contentId }, update, { runValidators: true });

    // Then apply patch ops (remove/add/update) without touching others
    if (b.assetsPatch) {
      const patch = b.assetsPatch;

      // Remove by _id
      if (Array.isArray(patch.removeIds) && patch.removeIds.length) {
        const ids = patch.removeIds
          .map(id => {
            try { return new mongoose.Types.ObjectId(id); } catch { return null; }
          })
          .filter(Boolean);
        if (ids.length) {
          await Content.updateOne(
            { _id: contentId },
            { $pull: { assets: { _id: { $in: ids } } } }
          );
        }
      }

      // Add new assets
      if (Array.isArray(patch.add) && patch.add.length) {
        const toAdd = normalizeAssets(patch.add);
        if (toAdd.length) {
          await Content.updateOne(
            { _id: contentId },
            { $push: { assets: { $each: toAdd } } }
          );
        }
      }

      // Optional per-asset updates (title/duration)
      if (Array.isArray(patch.update) && patch.update.length) {
        for (const u of patch.update) {
          if (!u || !u._id) continue;
          const id = (() => { try { return new mongoose.Types.ObjectId(u._id); } catch { return null; } })();
          if (!id) continue;
          const set = {};
          if (u.title != null) set['assets.$.title'] = u.title;
          if (u.duration != null) set['assets.$.duration'] = Number(u.duration) || 8;
          if (Object.keys(set).length) {
            await Content.updateOne({ _id: contentId, 'assets._id': id }, { $set: set });
          }
        }
      }
    }

    const fresh = await Content.findById(contentId);
    return res.json(fresh);
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }
};


exports.deleteContent = async (req, res) => {
  await Content.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};
