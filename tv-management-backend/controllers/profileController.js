const Profile = require('../models/Profile');

// Create a new profile
exports.createProfile = async (req, res) => {
  try {
    const { fileBase64, fileMime, ...rest } = req.body;
    const doc = { ...rest };
    if (fileBase64 && fileMime) {
      doc.media = { data: Buffer.from(fileBase64, 'base64'), contentType: fileMime };
      if (doc.url) delete doc.url;
    }
    if (doc.duration != null) doc.duration = Number(doc.duration) || 8;
    const profile = await Profile.create(doc);
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all profiles
exports.getProfiles = async (_req, res) => {
  try {
    const profiles = await Profile.find().populate('tv');
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get by ID
exports.getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id).populate('tv');
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update
exports.updateProfile = async (req, res) => {
  try {
    const { fileBase64, fileMime, clearMedia, ...rest } = req.body;
    const update = { ...rest };
    if (update.duration != null) update.duration = Number(update.duration) || 8;

    if (clearMedia) {
      update.$unset = { ...(update.$unset || {}), media: '' };
    } else if (fileBase64 && fileMime) {
      update.media = { data: Buffer.from(fileBase64, 'base64'), contentType: fileMime };
      if ('url' in update) delete update.url;
    }

    const profile = await Profile.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.status(200).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete
exports.deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findByIdAndDelete(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};