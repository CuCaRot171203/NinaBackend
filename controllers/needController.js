const Need = require('../models/Need');

// Get all needs
exports.getNeeds = async (req, res) => {
  try {
    const needs = await Need.find();
    res.json(needs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new need
exports.createNeed = async (req, res) => {
  try {
    const need = await Need.create(req.body);
    res.status(201).json(need);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
