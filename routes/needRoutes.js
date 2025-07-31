const express = require('express');
const router = express.Router();
const { getNeeds, createNeed } = require('../controllers/needController');

router.get('/', getNeeds);
router.post('/', createNeed);

module.exports = router;
