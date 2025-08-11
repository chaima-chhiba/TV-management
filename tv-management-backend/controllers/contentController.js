const Content = require('../models/Content');

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
    res.status(201).json(saved);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};


exports.getAllContent = async (req, res) => {
  const contents = await Content.find();
  res.json(contents);
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
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};


exports.deleteContent = async (req, res) => {
  await Content.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};
