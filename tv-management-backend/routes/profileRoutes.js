const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// CRUD routes for Profile
router.post('/', profileController.createProfile);
router.get('/', profileController.getProfiles);
router.get('/:id', profileController.getProfileById);
router.put('/:id', profileController.updateProfile);
router.delete('/:id', profileController.deleteProfile);

module.exports = router;