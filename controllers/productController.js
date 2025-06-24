const Product = require("../models/Product");
const { sendMail, buildProductEmail } = require('../utils/mailer')
const Subcribe = require('../models/Subcribe')
const User = require('../models/User')

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { 
        name, 
        price, 
        salePrice, 
        sold, 
        rated, 
        subcription, 
        description,
        category 
    } =  req.body;

    const product = await Product.create({
      name,
      price,
      salePrice: salePrice || price,
      sold: sold || 5,
      rated: rated || 5,
      productImageUrl: req.file?.path,
      subcription,
      description,
      category
    });

    console.log('✅ Sản phẩm vừa tạo:', product)
    const [subs, users] = await Promise.all([
      Subcribe.find({}, 'subscribeEmail'),
      User.find({}, 'email')
    ]);
    
    const emails = [
      ...subs.map(s => s.subscribeEmail),
      ...users.map(u => u.email)
    ].filter(Boolean);

    // Log email danh sách
    console.log('📧 Gửi mail tới:', emails)
    if (emails.length > 0) {
      const html = buildProductEmail(product)
    
      // Log nội dung email
      console.log('📩 HTML email preview:', html)
    
      try {
        await sendMail(emails.join(','), `🧙‍♀️ Sản phẩm mới tại Nina Witch: ${name.vi}`, html)
        console.log('✅ Gửi email thành công')
      } catch (e) {
        console.error('❌ Gửi email thất bại:', e)
      }
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    // Lấy thông tin page và limit từ query params, mặc định nếu không truyền vào
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Tính số lượng bản ghi cần skip
    const skip = (page - 1) * limit;

    // Tổng số sản phẩm
    const total = await Product.countDocuments();

    // Lấy danh sách sản phẩm theo trang
    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .populate('category', 'name');

    // Trả về danh sách sản phẩm và tổng số
    res.json({ products, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { 
        name, 
        price, 
        salePrice, 
        sold, 
        rated, 
        subcription, 
        description,
        category 
    } = req.body;

    const updatedData = {
      name,
      price,
      salePrice: salePrice || price,
      sold,
      rated,
      subcription,
      description,
      category
    };

    if (req.file?.path) {
      updatedData.productImageUrl = req.file.path;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );

    if (!updated)
      return res.status(404).json({ message: "Couldn't find product" });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res.status(404).json({ message: "couldn't find product" });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.filterProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const priceFrom = parseFloat(req.query.priceFrom);
    const priceTo = parseFloat(req.query.priceTo);

    const query = {};

    if (category) {
      query.category = category;
    }

    if (!isNaN(priceFrom) || !isNaN(priceTo)) {
      query.price = {};
      if (!isNaN(priceFrom)) query.price.$gte = priceFrom;
      if (!isNaN(priceTo)) query.price.$lte = priceTo;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    res.status(200).json({ products, total });
  } catch (error) {
    console.error("🔥 Lỗi ở filterProducts:", error);
    res.status(500).json({ message: error.message });
  }
};