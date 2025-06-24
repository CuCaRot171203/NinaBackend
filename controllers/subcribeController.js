const Subcribe = require("../models/Subcribe");

// Create
exports.createSubcribe = async (req, res) => {
  try {
    const { subscribeEmail } = req.body; // ✅ sửa destructuring

    if (!subscribeEmail) {
      return res.status(400).json({ message: "Email là bắt buộc." });
    }

    const subcribe = await Subcribe.create({ subscribeEmail });
    res.status(201).json(subcribe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all
exports.getAllSubcribes = async (req, res) => {
  try {
    const list = await Subcribe.find();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete
exports.deleteSubcribe = async (req, res) => {
  try {
    const deleted = await Subcribe.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy" });
    }
    res.json({ message: "Đã xoá đăng ký thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
