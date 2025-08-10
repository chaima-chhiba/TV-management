const Content = require('../models/Content');

exports.createContent = async (req, res) => {
  const content = new Content(req.body);
  await content.save();
  res.status(201).json(content);
};

exports.getAllContent = async (req, res) => {
  const contents = await Content.find();
  res.json(contents);
};

exports.updateContent = async (req, res) => {
  const content = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(content);
};

exports.deleteContent = async (req, res) => {
  await Content.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};
