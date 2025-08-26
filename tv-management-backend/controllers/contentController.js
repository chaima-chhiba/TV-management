const Content = require('../models/Content');
const Schedule = require('../models/Schedule'); // ADD

exports.createContent = async (req, res) => {
  try {
    const b = req.body;
    const targetTVIds = Array.isArray(b.tvs) && b.tvs.length ? b.tvs : (b.tv ? [b.tv] : []);

    const doc = new Content({
      title: b.title,
      description: b.description,
      type: b.type,
      layout: b.layout,
      tv: targetTVIds[0] || null,
      tvs: targetTVIds,
      profile: b.profile || null,
      content: b.type === 'text' ? b.content : undefined,
      url: b.type !== 'text' && b.url ? b.url : undefined
    });
    if (b.fileBase64 && b.fileMime) {
      doc.media = { data: Buffer.from(b.fileBase64, 'base64'), contentType: b.fileMime };
    }
    const saved = await doc.save();

    // schedule per TV (if provided)
    if (b.schedule && targetTVIds.length) {
      const s = b.schedule;
      if (s.enabled) {
        await Promise.all(targetTVIds.map(tvId =>
          Schedule.findOneAndUpdate(
            { tvId, contentId: saved._id },
            {
              tvId, contentId: saved._id,
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
    }

    res.status(201).json(saved);
  } catch (e) {
    res.status(400).json({ error: e.message });
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

exports.updateContent = async (req, res) => {
  try {
    const b = req.body;
    const prev = await Content.findById(req.params.id);
    if (!prev) return res.status(404).json({ error: 'Not found' });

    const newTVs = Array.isArray(b.tvs) && b.tvs.length
      ? b.tvs.map(String)
      : (b.tv ? [String(b.tv)] : (prev.tvs?.map(String) || (prev.tv ? [String(prev.tv)] : [])));

    const update = {
      title: b.title,
      description: b.description,
      type: b.type,
      layout: b.layout,
      tv: newTVs[0] || null,
      tvs: newTVs,
      profile: b.profile || null,
      content: b.type === 'text' ? b.content : undefined,
      url: b.type !== 'text' && b.url ? b.url : undefined
    };
    if (b.fileBase64 && b.fileMime) {
      update.media = { data: Buffer.from(b.fileBase64, 'base64'), contentType: b.fileMime };
    } else if (b.clearFile) {
      update.$unset = { media: 1 };
    }

    const doc = await Content.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });

    // If schedule provided, sync with newTVs
    if (b.schedule) {
      const s = b.schedule;
      const enabled = s.enabled !== false;
      const prevSet = new Set((prev.tvs?.map(String) || (prev.tv ? [String(prev.tv)] : [])));
      const newSet = new Set(newTVs);

      const added = [...newSet].filter(x => !prevSet.has(x));
      const removed = [...prevSet].filter(x => !newSet.has(x));

      if (enabled) {
        await Promise.all(newTVs.map(tvId =>
          Schedule.findOneAndUpdate(
            { tvId, contentId: doc._id },
            {
              tvId, contentId: doc._id,
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
        if (removed.length) {
          await Schedule.deleteMany({ contentId: doc._id, tvId: { $in: removed } });
        }
      } else {
        await Schedule.deleteMany({ contentId: doc._id });
      }
    }

    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};


exports.deleteContent = async (req, res) => {
  await Content.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};
