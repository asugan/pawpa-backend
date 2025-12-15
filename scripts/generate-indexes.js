const mongoose = require('mongoose');
require('dotenv').config();

async function generateIndexes() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔧 Generating MongoDB indexes...');

    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    console.log('✅ Connected to MongoDB');

    // Indexes for Better-Auth collections (handled by adapter)
    console.log('\n📋 Better-Auth Collection Indexes:');

    // User collection indexes
    await db.collection('user').createIndex({ email: 1 }, { unique: true });
    console.log('   ✓ User collection: email (unique)');

    // Session collection indexes
    await db.collection('session').createIndex({ userId: 1 });
    await db.collection('session').createIndex({ token: 1 }, { unique: true });
    await db.collection('session').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('   ✓ Session collection: userId, token (unique), expiresAt (TTL)');

    // Account collection indexes
    await db.collection('account').createIndex({ userId: 1 });
    await db.collection('account').createIndex({ provider: 1, providerAccountId: 1 }, { unique: true });
    console.log('   ✓ Account collection: userId, provider+providerAccountId (unique)');

    // Verification collection indexes
    await db.collection('verification').createIndex({ identifier: 1, value: 1 });
    await db.collection('verification').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('   ✓ Verification collection: identifier+value, expiresAt (TTL)');

    // Indexes for application collections
    console.log('\n📋 Application Collection Indexes:');

    // Pets collection
    await db.collection('pets').createIndex({ userId: 1 });
    await db.collection('pets').createIndex({ userId: 1, name: 1 });
    await db.collection('pets').createIndex({ userId: 1, type: 1 });
    console.log('   ✓ Pets: userId, userId+name, userId+type');

    // Health records collection
    await db.collection('health_records').createIndex({ userId: 1 });
    await db.collection('health_records').createIndex({ userId: 1, petId: 1 });
    await db.collection('health_records').createIndex({ userId: 1, date: -1 });
    await db.collection('health_records').createIndex({ userId: 1, petId: 1, type: 1 });
    console.log('   ✓ Health Records: userId, userId+petId, userId+date, userId+petId+type');

    // Events collection
    await db.collection('events').createIndex({ userId: 1 });
    await db.collection('events').createIndex({ userId: 1, petId: 1 });
    await db.collection('events').createIndex({ userId: 1, startTime: 1 });
    await db.collection('events').createIndex({ userId: 1, type: 1 });
    console.log('   ✓ Events: userId, userId+petId, userId+startTime, userId+type');

    // Feeding schedules collection
    await db.collection('feeding_schedules').createIndex({ userId: 1 });
    await db.collection('feeding_schedules').createIndex({ userId: 1, petId: 1 });
    await db.collection('feeding_schedules').createIndex({ userId: 1, active: 1 });
    console.log('   ✓ Feeding Schedules: userId, userId+petId, userId+active');

    // Expenses collection
    await db.collection('expenses').createIndex({ userId: 1 });
    await db.collection('expenses').createIndex({ userId: 1, petId: 1 });
    await db.collection('expenses').createIndex({ userId: 1, date: -1 });
    await db.collection('expenses').createIndex({ userId: 1, category: 1 });
    console.log('   ✓ Expenses: userId, userId+petId, userId+date, userId+category');

    // User budgets collection
    await db.collection('user_budgets').createIndex({ userId: 1 }, { unique: true });
    console.log('   ✓ User Budgets: userId (unique)');

    // Subscriptions collection
    await db.collection('subscriptions').createIndex({ userId: 1 }, { unique: true });
    await db.collection('subscriptions').createIndex({ status: 1 });
    await db.collection('subscriptions').createIndex({ currentPeriodEnd: 1 });
    console.log('   ✓ Subscriptions: userId (unique), status, currentPeriodEnd');

    // Device trial registry collection
    await db.collection('device_trial_registries').createIndex({ userId: 1 });
    await db.collection('device_trial_registries').createIndex({ deviceId: 1 }, { unique: true });
    await db.collection('device_trial_registries').createIndex({ trialStatus: 1 });
    await db.collection('device_trial_registries').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('   ✓ Device Trial Registry: userId, deviceId (unique), trialStatus, expiresAt (TTL)');

    // Get index stats
    console.log('\n📊 Index Statistics:');
    const collections = await db.listCollections().toArray();

    let totalIndexes = 0;
    for (const collection of collections) {
      const indexes = await db.collection(collection.name).listIndexes().toArray();
      console.log(`   ${collection.name}: ${indexes.length} indexes`);
      totalIndexes += indexes.length;
    }

    console.log(`\n✅ Total indexes created: ${totalIndexes}`);

    await mongoose.connection.close();
    console.log('\n✅ Index generation completed successfully!');

  } catch (error) {
    console.error('❌ Error generating indexes:', error);
    process.exit(1);
  }
}

generateIndexes();