const Content = require('../models/Content');
const Schedule = require('../models/Schedule'); // ADD

exports.createContent = async (req, res) => {
  try {
    const b = req.body;
    const doc = new Content({
      title: b.title,
      description: b.description,
      type: b.type,
      layout: b.layout,
      tv: b.tv || null,
      profile: b.profile || null,
      content: b.type === 'text' ? b.content : undefined,
      url: b.type !== 'text' && b.url ? b.url : undefined
    });
    if (b.fileBase64 && b.fileMime) {
      doc.media = {
        data: Buffer.from(b.fileBase64, 'base64'),
        contentType: b.fileMime
      };
    }
    const saved = await doc.save();

    // ADD: optional schedule upsert if provided and tv is selected
    if (b.schedule && b.tv) {
      const s = b.schedule;
      if (s.enabled) {
        await Schedule.findOneAndUpdate(
          { tvId: b.tv, contentId: saved._id },
          {
            tvId: b.tv,
            contentId: saved._id,
            daysOfWeek: Array.isArray(s.daysOfWeek) ? s.daysOfWeek : [0,1,2,3,4,5,6],
            startTime: s.startTime || '00:00',
            endTime: s.endTime || '23:59',
            startDate: s.startDate || null,
            endDate: s.endDate || null,
            timezone: s.timezone || 'UTC',
            enabled: true
          },
          { upsert: true, new: true }
        );
      } else {
        await Schedule.findOneAndDelete({ tvId: b.tv, contentId: saved._id });
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

exports.getContentsPublic = async (req, res) => {
  try {
    // return minimal fields needed by Display
    const items = await Content.find({}, '-__v')
      .sort({ createdAt: 1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const b = req.body;
    const update = {
      title: b.title,
      description: b.description,
      type: b.type,
      layout: b.layout,
      tv: b.tv || null,
      profile: b.profile || null,
      content: b.type === 'text' ? b.content : undefined,
      url: b.type !== 'text' && b.url ? b.url : undefined
    };
    if (b.fileBase64 && b.fileMime) {
      update.media = {
        data: Buffer.from(b.fileBase64, 'base64'),
        contentType: b.fileMime
      };
    } else if (b.clearFile) {
      update.$unset = { media: 1 };
    }
    const doc = await Content.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });

    // ADD: upsert/clear schedule for this content+tv if provided
    if (b.schedule && (b.tv || doc.tv)) {
      const tvId = b.tv || doc.tv;
      const s = b.schedule;
      if (s.enabled) {
        await Schedule.findOneAndUpdate(
          { tvId, contentId: doc._id },
          {
            tvId,
            contentId: doc._id,
            daysOfWeek: Array.isArray(s.daysOfWeek) ? s.daysOfWeek : [0,1,2,3,4,5,6],
            startTime: s.startTime || '00:00',
            endTime: s.endTime || '23:59',
            startDate: s.startDate || null,
            endDate: s.endDate || null,
            timezone: s.timezone || 'UTC',
            enabled: true
          },
          { upsert: true, new: true }
        );
      } else {
        await Schedule.findOneAndDelete({ tvId, contentId: doc._id });
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
