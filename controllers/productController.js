const Product = require("../models/Product");
const Category = require('../models/Category')
const { sendMail, buildProductEmail } = require('../utils/mailer')
const Subcribe = require('../models/Subcribe')
const User = require('../models/User')
const mongoose = require('mongoose');

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

// exports.filterProducts = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const category = req.query.category;
//     const priceFrom = parseFloat(req.query.priceFrom);
//     const priceTo = parseFloat(req.query.priceTo);

//     const query = {};

//     if (category) {
//       query.category = category;
//     }

//     if (!isNaN(priceFrom) || !isNaN(priceTo)) {
//       query.price = {};
//       if (!isNaN(priceFrom)) query.price.$gte = priceFrom;
//       if (!isNaN(priceTo)) query.price.$lte = priceTo;
//     }

//     const skip = (page - 1) * limit;

//     const [products, total] = await Promise.all([
//       Product.find(query)
//         .populate('category', 'name')
//         .skip(skip)
//         .limit(limit),
//       Product.countDocuments(query)
//     ]);

//     res.status(200).json({ products, total });
//   } catch (error) {
//     console.error("🔥 Lỗi ở filterProducts:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

exports.filterProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const rawCategory = req.query.category;
    const rawPriceFrom = req.query.priceFrom;
    const rawPriceTo = req.query.priceTo;

    const priceFrom = rawPriceFrom ? parseFloat(rawPriceFrom) : undefined;
    const priceTo = rawPriceTo ? parseFloat(rawPriceTo) : undefined;

    if (rawPriceFrom && isNaN(priceFrom)) {
      return res.status(400).json({ message: 'Invalid priceFrom format. Must be a number.' });
    }
    if (rawPriceTo && isNaN(priceTo)) {
      return res.status(400).json({ message: 'Invalid priceTo format. Must be a number.' });
    }

    // if (!rawCategory && !rawPriceFrom && !rawPriceTo) {
    //   return res.status(400).json({ message: 'At least one filter (category or price) must be provided.' });
    // }

    const query = {};

    // ✅ Nếu rawCategory là ObjectId hợp lệ => dùng trực tiếp
    if (rawCategory) {
      if (mongoose.Types.ObjectId.isValid(rawCategory)) {
        query.category = rawCategory;
      } else {
        const categoryDoc = await Category.findOne({
          $or: [
            { 'name.en': new RegExp(`^${rawCategory}$`, 'i') },
            { 'name.vi': new RegExp(`^${rawCategory}$`, 'i') }
          ]
        });

        if (!categoryDoc) {
          return res.status(404).json({ message: `Category "${rawCategory}" not found.` });
        }

        query.category = categoryDoc._id;
      }
    }

    const allProducts = await Product.find(query).populate('category', 'name');

    const parsePrice = (str) => {
      if (typeof str !== 'string') return NaN;
      const cleaned = str.replace(/[^\d]/g, '');
      return parseFloat(cleaned);
    };

    const filtered = allProducts.filter((product) => {
      const priceRaw = product.price;

      if (typeof priceRaw === 'string' && priceRaw.toLowerCase().includes('contact')) {
        return true;
      }

      const priceNum = parsePrice(priceRaw);
      if (isNaN(priceNum)) return false;

      if (!isNaN(priceFrom) && priceNum < priceFrom) return false;
      if (!isNaN(priceTo) && priceNum > priceTo) return false;

      return true;
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    return res.status(200).json({ products: paginated, total });

  } catch (error) {
    console.error("🔥 filterProducts error:", error);
    return res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

exports.getRandomProducts = async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 4;

    const allProducts = await Product.find().populate('category', 'name');

    if (allProducts.length === 0) {
      return res.status(404).json({ message: 'No products found.' });
    }

    const shuffled = allProducts.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, allProducts.length));

    res.status(200).json(selected);
  } catch (error) {
    console.error('🔥 getRandomProducts error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};
