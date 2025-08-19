const Schedule = require('../models/Schedule');

exports.createSchedule = async (req, res) => {
  const schedule = new Schedule(req.body);
  await schedule.save();
  res.status(201).json(schedule);
};

exports.getAllSchedules = async (_req, res) => {
  const schedules = await Schedule.find().populate('tvId').populate('contentId');
  res.json(schedules);
};

// Public: get schedules for a TV (used by Display)
exports.getSchedulesByTv = async (req, res) => {
  try {
    const { tvId } = req.params;
    const schedules = await Schedule.find({ tvId }, '-__v').populate('contentId');
    res.json(schedules);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateSchedule = async (req, res) => {
  const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(schedule);
};

exports.deleteSchedule = async (req, res) => {
  await Schedule.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};