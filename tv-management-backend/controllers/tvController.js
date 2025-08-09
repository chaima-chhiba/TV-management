const TV = require('../models/TV');

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
