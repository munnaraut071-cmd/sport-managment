const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.deleteMany({ email: { $in: ['admin@sportkits.com', 'user@sportkits.com'] } });
  console.log('Old users deleted');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
