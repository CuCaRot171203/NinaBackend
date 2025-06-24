// removeIndex.jsconst mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Ninawitch';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ Kết nối MongoDB thành công');

    const result = await mongoose.connection.db.collection('subcribes').dropIndex('subcribeEmail_1');
    console.log('✅ Đã xoá index:', result);

    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('❌ Lỗi:', err.message);
  });