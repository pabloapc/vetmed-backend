require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const email = 'qa-nearby-test@example.com';
  await User.deleteOne({ email });
  const u = await User.create({
    name: 'QA Nearby Test',
    email,
    password: 'placeholder-not-used-1234',
    role: 'user',
    isVerified: true,
    location: { type: 'Point', coordinates: [-64.19, -31.42] },
  });
  console.log('created:', u._id.toString());
  await mongoose.disconnect();
})();
