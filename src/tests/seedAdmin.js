const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Define schema directly without pre-save hooks
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  status: String
});

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', userSchema);

    // Delete existing admin
    const deleted = await User.deleteMany({ email: 'admin@finance.com' });
    console.log(`✅ Deleted ${deleted.deletedCount} existing admin user(s)`);

    // Hash password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);
    
    console.log('Generated hash:', hashedPassword);

    // Create admin with manually hashed password
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@finance.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });

    console.log('✅ Admin user created successfully:');
    console.log('📧 Email: admin@finance.com');
    console.log('🔑 Password: Admin123!');
    console.log('🆔 User ID:', admin._id);
    console.log('🔒 Password hash stored in DB');

    // Verify the password works
    const isMatch = await bcrypt.compare('Admin123!', admin.password);
    console.log('✅ Password verification test:', isMatch ? 'PASSED' : 'FAILED');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();