const Product = require("../models/Product");
const Feedback = require("../models/Feedback");
const { cloudinary } = require("../utils/cloudinary");

exports.getFeedbackImagesByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Lấy product từ ID
    const product = await Product.findById(productId).populate("category");
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 2. Lấy feedback theo category
    const feedbacks = await Feedback.find({ category: product.category._id });

    res.json({ feedbacks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.uploadFeedbackImage = async (req, res) => {
  try {
    const { categoryId } = req.body;
    const image = req.file.path; // middleware multer sẽ xử lý

    const feedback = await Feedback.create({
      category: categoryId,
      imageUrl: image,
    });

    res.status(201).json({ feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};