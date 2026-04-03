const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const testLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the User model
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String,
      name: String,
      role: String,
      status: String
    }));

    // Find the user
    const user = await User.findOne({ email: 'anana@finance.com' });
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('📧 User found:', user.email);
    console.log('🔑 Stored password hash:', user.password);
    console.log('📝 Hash length:', user.password.length);
    console.log('🔍 Hash starts with $2b$?', user.password.startsWith('$2b$'));
    console.log('');

    // Test password "1234567"
    const testPassword = '1234567';
    console.log('🔐 Testing password: "1234567"');
    
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('✅ Password match result:', isMatch);
    console.log('');

    if (isMatch) {
      console.log('🎉 Login would work!');
    } else {
      console.log('❌ Login would FAIL!');
      console.log('\n📌 Creating new hash for debugging...');
      
      // Create a new hash to see if it matches
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('New hash for "1234567":', newHash);
      console.log('Does new hash match stored?', newHash === user.password);
      
      // Update the password with new hash
      await User.updateOne(
        { email: 'anana@finance.com' },
        { password: newHash }
      );
      console.log('\n✅ Password has been reset! Try logging in now.');
    }

    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testLogin();