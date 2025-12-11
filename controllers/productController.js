const Product = require("../models/Product");
const Category = require('../models/Category')
const { sendMail, buildProductEmail } = require('../utils/mailer')
const Subcribe = require('../models/Subcribe')
const User = require('../models/User')
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Create product
// exports.createProduct = async (req, res) => {
//   try {
//     const { 
//         name, 
//         price, 
//         salePrice, 
//         sold, 
//         rated, 
//         subcription, 
//         description,
//         category,
//         need
//     } =  req.body;

//     const product = await Product.create({
//       name,
//       price,
//       salePrice: salePrice || price,
//       sold: sold || 5,
//       rated: rated || 5,
//       productImageUrl: req.file?.path,
//       subcription,
//       description,
//       category,
//       need // ✅ include this
//     });

//     const [subs, users] = await Promise.all([
//       Subcribe.find({}, 'subscribeEmail'),
//       User.find({}, 'email')
//     ]);

//     const emails = [
//       ...subs.map(s => s.subscribeEmail),
//       ...users.map(u => u.email)
//     ].filter(Boolean);

//     if (emails.length > 0) {
//       const html = buildProductEmail(product);
//       await sendMail(emails.join(','), `🧙‍♀️ Sản phẩm mới tại Nina Witch: ${name.vi}`, html);
//     }

//     res.status(201).json(product);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// helpers
const safeParse = (val) => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch (e) { return val; }
};
const normalizePrice = (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') return v;
  const cleaned = String(v).replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? undefined : num;
};
// helper timeout wrapper
const withTimeout = (p, ms, label = 'operation') => {
  let timer;
  const timeout = new Promise((_, rej) => {
    timer = setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p.then(r => { clearTimeout(timer); return r }), timeout]);
};

// New createProduct
exports.createProduct = async (req, res) => {
  try {
    console.log('--- createProduct req.body ---', req.body);
    console.log('--- createProduct req.file ---', !!req.file, req.file && {
      path: req.file.path,
      secure_url: req.file.secure_url,
      filename: req.file.filename,
    });

    // Parse + normalize
    const name = safeParse(req.body.name);
    const subcription = safeParse(req.body.subcription);
    const description = safeParse(req.body.description);

    const price = normalizePrice(req.body.price);
    const salePrice = normalizePrice(req.body.salePrice) ?? price;

    const { sold, rated, category, need } = req.body;

    // Minimal validation
    if (!name || !name.vi || !name.en) {
      return res.status(400).json({ message: 'Thiếu name.vi hoặc name.en' });
    }
    if (!category) {
      return res.status(400).json({ message: 'Thiếu category' });
    }
    if (price === undefined) {
      return res.status(400).json({ message: 'Giá không hợp lệ hoặc thiếu' });
    }

    const productData = {
      name,
      price,
      salePrice,
      sold: sold !== undefined ? Number(sold) : 0,
      rated: rated !== undefined ? Number(rated) : 0,
      productImageUrl: req.file && (req.file.path || req.file.secure_url) || undefined,
      subcription,
      description,
      category,
      need
    };

    // Create product quickly (DB op)
    const product = await Product.create(productData);

    // Immediately respond so client không bị timeout
    res.status(201).json(product);

    // Background tasks (non-blocking)
    setImmediate(async () => {
      try {
        // 1) Log if file exists but no URL set
        if (req.file && !product.productImageUrl) {
          console.warn('Warning: file provided but no productImageUrl set on req.file:', req.file);
        }

        // 2) Fetch subscribers and users with timeout
        let subs = [], users = [];
        try {
          const [subsRes, usersRes] = await withTimeout(
            Promise.all([ Subcribe.find({}, 'subscribeEmail').lean(), User.find({}, 'email').lean() ]),
            5000,
            'fetch-subs-and-users'
          );
          subs = subsRes || [];
          users = usersRes || [];
        } catch (err) {
          console.error('Warning: fetch subs/users failed or timed out:', err.message || err);
        }

        const emails = [
          ...subs.map(s => s.subscribeEmail),
          ...users.map(u => u.email)
        ].filter(Boolean);

        if (emails.length > 0) {
          const html = buildProductEmail(product);
          try {
            // sendMail wrapped with timeout (8s)
            await withTimeout(sendMail(emails.join(','), `🧙‍♀️ Sản phẩm mới tại Nina Witch: ${product.name?.vi || 'Sản phẩm mới'}`, html), 8000, 'sendMail');
            console.log('Notification emails sent for product', product._id);
          } catch (err) {
            console.error('Failed to send notification emails (non-fatal):', err.message || err);
          }
        }
      } catch (bgErr) {
        console.error('Background tasks error:', bgErr);
      }
    });

  } catch (error) {
    console.error("🔥 createProduct error (main):", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();

    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .populate('category', 'name')
      .populate('need', 'name'); // ✅ include subCategory

    res.json({ products, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Update product
// exports.updateProduct = async (req, res) => {
//   try {
//     const {
//       name,
//       price,
//       salePrice,
//       sold,
//       rated,
//       subcription,
//       description,
//       category,
//       need // ✅ include this
//     } = req.body;

//     const updatedData = {
//       name,
//       price,
//       salePrice: salePrice || price,
//       sold,
//       rated,
//       subcription,
//       description,
//       category,
//       need
//     };

//     if (req.file?.path) {
//       updatedData.productImageUrl = req.file.path;
//     }

//     const updated = await Product.findByIdAndUpdate(req.params.id, updatedData, {
//       new: true,
//     });

//     if (!updated)
//       return res.status(404).json({ message: "Couldn't find product" });

//     res.json(updated);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.updateProduct = async (req, res) => {
  try {
    console.log('--- updateProduct req.body ---', req.body);
    console.log('--- updateProduct req.file ---', req.file && {
      path: req.file.path,
      secure_url: req.file.secure_url,
      filename: req.file.filename,
    });

    const name = safeParse(req.body.name);
    const subcription = safeParse(req.body.subcription);
    const description = safeParse(req.body.description);

    const price = normalizePrice(req.body.price);
    const salePrice = normalizePrice(req.body.salePrice);

    const updatedData = {};

    if (name) updatedData.name = name;
    if (price !== undefined) updatedData.price = price;
    if (salePrice !== undefined) updatedData.salePrice = salePrice;
    if (req.body.sold !== undefined) updatedData.sold = Number(req.body.sold);
    if (req.body.rated !== undefined) updatedData.rated = Number(req.body.rated);
    if (subcription) updatedData.subcription = subcription;
    if (description) updatedData.description = description;
    if (req.body.category) updatedData.category = req.body.category;
    if (req.body.need) updatedData.need = req.body.need;
    if (req.file && (req.file.path || req.file.secure_url)) {
      updatedData.productImageUrl = req.file.path || req.file.secure_url;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true
    });

    if (!updated)
      return res.status(404).json({ message: "Couldn't find product" });

    res.json(updated);
  } catch (error) {
    console.error("🔥 updateProduct error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
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
    const product = await Product.findById(req.params.id).populate('category', 'name').populate('need', 'name');
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

    const { category: rawCategory, need: rawNeed, priceFrom: rawPriceFrom, priceTo: rawPriceTo } = req.query;

    const priceFrom = rawPriceFrom ? parseFloat(rawPriceFrom) : undefined;
    const priceTo = rawPriceTo ? parseFloat(rawPriceTo) : undefined;

    if (rawPriceFrom && isNaN(priceFrom)) {
      return res.status(400).json({ message: 'Invalid priceFrom format. Must be a number.' });
    }
    if (rawPriceTo && isNaN(priceTo)) {
      return res.status(400).json({ message: 'Invalid priceTo format. Must be a number.' });
    }

    const query = {};

    // Category filter
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
        if (!categoryDoc) return res.status(404).json({ message: `Category "${rawCategory}" not found.` });
        query.category = categoryDoc._id;
      }
    }

    // Need filter
    if (rawNeed) {
      if (mongoose.Types.ObjectId.isValid(rawNeed)) {
        query.need = rawNeed;
      } else {
        const needDoc = await mongoose.model('Need').findOne({
          $or: [
            { 'name.en': new RegExp(`^${rawNeed}$`, 'i') },
            { 'name.vi': new RegExp(`^${rawNeed}$`, 'i') }
          ]
        });
        if (!needDoc) return res.status(404).json({ message: `Need "${rawNeed}" not found.` });
        query.need = needDoc._id;
      }
    }

    const allProducts = await Product.find(query)
      .populate('category', 'name')
      .populate('need', 'name');

    const parsePrice = (str) => {
      if (typeof str !== 'string') return NaN;
      const cleaned = str.replace(/[^\d]/g, '');
      return parseFloat(cleaned);
    };

    const filtered = allProducts.filter((product) => {
      const priceRaw = product.price;
      if (typeof priceRaw === 'string' && priceRaw.toLowerCase().includes('contact')) return true;
      const priceNum = parsePrice(priceRaw);
      if (isNaN(priceNum)) return false;
      if (!isNaN(priceFrom) && priceNum < priceFrom) return false;
      if (!isNaN(priceTo) && priceNum > priceTo) return false;
      return true;
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    res.status(200).json({ products: paginated, total });

  } catch (error) {
    console.error("🔥 filterProducts error:", error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};


exports.getRandomProducts = async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 4;

    const allProducts = await Product.find()
      .populate('category', 'name')
      .populate('need', 'name');
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

exports.exportEnglishProductNames = async (req, res) => {
  try {
    const products = await Product.find({}, 'name');
    const englishNames = products.map(p => p.name?.en).filter(Boolean);

    const filePath = path.join(__dirname, '../exports/englishProductNames.json');

    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // Ghi ra file JSON
    fs.writeFileSync(filePath, JSON.stringify(englishNames, null, 2), 'utf-8');

    res.status(200).json({
      message: 'Exported English product names successfully.',
      count: englishNames.length,
      file: '/exports/englishProductNames.json',
      data: englishNames
    });
  } catch (error) {
    console.error("🔥 exportEnglishProductNames error:", error);
    res.status(500).json({ message: 'Internal server error while exporting names.' });
  }
};
