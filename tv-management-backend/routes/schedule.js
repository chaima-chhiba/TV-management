const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// existing CRUD
router.post('/', scheduleController.createSchedule);
router.get('/', scheduleController.getAllSchedules);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

// ADD: get schedules for a TV
router.get('/tv/:tvId', scheduleController.getSchedulesByTv);

module.exports = router;