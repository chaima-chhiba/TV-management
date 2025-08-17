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

exports.getSchedulesByTv = async (req, res) => {
  const { tvId } = req.params;
  const schedules = await Schedule.find({ tvId, enabled: true }).populate('contentId');
  res.json(schedules);
};

exports.updateSchedule = async (req, res) => {
  const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(schedule);
};

exports.deleteSchedule = async (req, res) => {
  await Schedule.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};