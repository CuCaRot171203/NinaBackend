// utils/mailer.js
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
})

function buildProductEmail(product) {
  const name = product.name?.vi || product.name?.en || 'Không tên';
  const description = product.description?.vi || product.description?.en || 'Không có mô tả';
  const price = product.salePrice || product.price || 'Liên hệ';
  const image = product.productImageUrl || 'https://via.placeholder.com/600x400?text=No+Image';
  const clientUrl = process.env.CLIENT_URL || 'https://yourdomain.com';
  const productLink = `${clientUrl.replace(/\/$/, '')}/products/${product._id}`;

  return `
    <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden;">
        <img src="${image}" alt="${name}" style="width: 100%; object-fit: cover;" />
        <div style="padding: 20px;">
          <h2 style="color: #333333;">🎉 Sản phẩm mới: ${name}</h2>
          <p style="color: #555555;">${description}</p>
          <p><strong>Giá:</strong> <span style="color: #e91e63;">${(typeof price === 'number' ? price.toLocaleString() : price)} VNĐ</span></p>
          <div style="margin-top:12px;text-align:center;">
            <a href="${productLink}" target="_blank" style="
              display: inline-block;
              padding: 10px 16px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 4px;">Xem chi tiết sản phẩm</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildProductEmail(product) {
  const name = product.name?.vi || product.name?.en || 'Không tên';
  const description = product.description?.vi || product.description?.en || 'Không có mô tả';
  const price = product.salePrice || product.price || 'Liên hệ';
  const image = product.productImageUrl || 'https://via.placeholder.com/600x400?text=No+Image';
  const clientUrl = process.env.CLIENT_URL || 'https://yourdomain.com';
  const productLink = `${clientUrl.replace(/\/$/, '')}/products/${product._id}`;

  return `
    <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden;">
        <img src="${image}" alt="${name}" style="width: 100%; object-fit: cover;" />
        <div style="padding: 20px;">
          <h2 style="color: #333333;">🎉 Sản phẩm mới: ${name}</h2>
          <p style="color: #555555;">${description}</p>
          <p><strong>Giá:</strong> <span style="color: #e91e63;">${(typeof price === 'number' ? price.toLocaleString() : price)} VNĐ</span></p>
          <div style="margin-top:12px;text-align:center;">
            <a href="${productLink}" target="_blank" style="
              display: inline-block;
              padding: 10px 16px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 4px;">Xem chi tiết sản phẩm</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function sendMail(toOrOptions, subject, html) {
  let mailOptions;

  if (typeof toOrOptions === 'object' && toOrOptions !== null && !Array.isArray(toOrOptions)) {
    mailOptions = {
      from: `"Nina Witch" <${process.env.MAIL_USER}>`,
      ...toOrOptions
    };
  } else {
    mailOptions = {
      from: `"Nina Witch" <${process.env.MAIL_USER}>`,
      to: toOrOptions,
      subject,
      html
    };
  }

  return transporter.sendMail(mailOptions);
}

module.exports = { transporter, sendMail, buildProductEmail }
