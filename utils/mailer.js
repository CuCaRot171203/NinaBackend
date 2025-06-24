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
  const name = product.name?.vi || 'Không tên'
  const description = product.description?.vi || 'Không có mô tả'
  const price = product.salePrice || product.price || 'Liên hệ'
  const image = product.productImageUrl || 'https://via.placeholder.com/600x400?text=No+Image'

  return `
    <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden;">
        <img src="${image}" alt="${name}" style="width: 100%; object-fit: cover;" />
        <div style="padding: 20px;">
          <h2 style="color: #333333;">🎉 Sản phẩm mới: ${name}</h2>
          <p style="color: #555555;">${description}</p>
          <p><strong>Giá:</strong> <span style="color: #e91e63;">${price.toLocaleString()} VNĐ</span></p>
          <a href="https://yourdomain.com/shop" target="_blank" style="
            display: inline-block;
            margin-top: 12px;
            padding: 10px 16px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;">Xem sản phẩm</a>
        </div>
      </div>
    </div>
  `
}

function sendMail(to, subject, html) {
  return transporter.sendMail({
    from: `"Nina Witch" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html
  })
}

module.exports = { sendMail, buildProductEmail }
