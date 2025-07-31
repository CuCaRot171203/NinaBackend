const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const upload = multer({ storage });
const { getFeedbackImagesByProductId, uploadFeedbackImage } = require("../controllers/feedbackController");

router.get("/product/:productId", getFeedbackImagesByProductId);
router.post("/upload", upload.single("image"), uploadFeedbackImage);

module.exports = router;