const Profile = require('../models/Profile');

// Create a new profile
exports.createProfile = async (req, res) => {
  try {
    const profile = await Profile.create(req.body);
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all profiles
exports.getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().populate('tv'); // Populate TV reference
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single profile by ID
exports.getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id).populate('tv');
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a profile
exports.updateProfile = async (req, res) => {
  try {
    const profile = await Profile.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.status(200).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a profile
exports.deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findByIdAndDelete(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};