const mongoose = require('mongoose');
require('dotenv').config();

async function cleanDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🧹 Cleaning MongoDB database...');
    console.log('⚠️  This will delete ALL data in the database');

    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Are you sure you want to continue? (yes/no): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled');
      process.exit(0);
    }

    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log('✅ Database is already empty');
    } else {
      console.log(`📁 Dropping ${collections.length} collections...`);

      for (const collection of collections) {
        await db.collection(collection.name).drop();
        console.log(`   ✓ Dropped: ${collection.name}`);
      }
    }

    await mongoose.connection.close();
    console.log('✅ Database cleaned successfully');

  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
    process.exit(1);
  }
}

cleanDatabase();