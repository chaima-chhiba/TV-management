const TV = require('../models/TV');

// Public ping: mark TV online/offline for Dashboard dot
exports.pingPublicTV = async (req, res) => {
  try {
    const { id } = req.params;
    const status = (req.body && req.body.status) || 'online';
    const tv = await TV.findByIdAndUpdate(
      id,
      { status, lastSeen: new Date() },
      { new: true }
    );
    if (!tv) return res.status(404).json({ error: 'TV not found' });
    res.json({ ok: true, status: tv.status, lastSeen: tv.lastSeen });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createTV = async (req, res) => {
  const tv = new TV(req.body);
  await tv.save();
  res.status(201).json(tv);
};

exports.getAllTVs = async (req, res) => {
  const tvs = await TV.find();
  res.json(tvs);
};

exports.updateTV = async (req, res) => {
  const tv = await TV.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(tv);
};

exports.deleteTV = async (req, res) => {
  await TV.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};

// Public: fetch TV by exact name (case-sensitive). Adjust if you want case-insensitive.
exports.getByNamePublic = async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name || '');
    if (!name) return res.status(400).json({ error: 'name required' });
    // For case-insensitive lookup, use { name: new RegExp(`^${escapeRegExp(name)}$`, 'i') }
    const tv = await TV.findOne({ name }, '-__v');
    if (!tv) return res.status(404).json({ error: 'TV not found' });
    res.json(tv);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
