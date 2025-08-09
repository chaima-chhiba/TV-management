const express = require('express');
const router = express.Router();
const tvController = require('../controllers/tvController');

router.post('/', tvController.createTV);
router.get('/', tvController.getAllTVs);
router.put('/:id', tvController.updateTV);
router.delete('/:id', tvController.deleteTV);

module.exports = router;
