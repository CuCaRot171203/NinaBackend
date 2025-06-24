const express = require('express');
const router = express.Router();

const {
  createSubcribe,
  getAllSubcribes,
  deleteSubcribe
} = require('../controllers/subcribeController');

router.post('/', createSubcribe);
router.get('/', getAllSubcribes);
router.delete('/:id', deleteSubcribe);

module.exports = router;