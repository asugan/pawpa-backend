const mongoose = require('mongoose');
require('dotenv').config();

async function checkMongoConnection() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔍 Checking MongoDB connection...');
    console.log(`📍 URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);

    await mongoose.connect(mongoUri);

    const db = mongoose.connection;
    const admin = mongoose.connection.db.admin();

    // Get server status
    const status = await admin.serverStatus();
    console.log(`✅ MongoDB connected successfully`);
    console.log(`📊 Version: ${status.version}`);
    console.log(`🏠 Database: ${db.name}`);

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections (${collections.length}):`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    await mongoose.connection.close();
    console.log('✅ Connection closed');

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

checkMongoConnection();