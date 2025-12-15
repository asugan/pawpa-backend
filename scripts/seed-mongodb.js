const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Import mongoose models
const { PetModel, HealthRecordModel, EventModel, FeedingScheduleModel, ExpenseModel, UserBudgetModel, SubscriptionModel, DeviceTrialRegistryModel } = require('../dist/models/mongoose/index.js');

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🌱 Seeding MongoDB database...');

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clean existing data first
    console.log('🧹 Cleaning existing data...');
    await PetModel.deleteMany({});
    await HealthRecordModel.deleteMany({});
    await EventModel.deleteMany({});
    await FeedingScheduleModel.deleteMany({});
    await ExpenseModel.deleteMany({});
    await UserBudgetModel.deleteMany({});
    await SubscriptionModel.deleteMany({});
    await DeviceTrialRegistryModel.deleteMany({});
    console.log('✅ Data cleaned');

    // Get a test user ID (you may need to adjust this based on your auth setup)
    const client = new MongoClient(mongoUri);
    const db = client.db();
    const usersCollection = db.collection('user');

    // Create a test user if none exists
    let testUser = await usersCollection.findOne();
    if (!testUser) {
      const result = await usersCollection.insertOne({
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      testUser = { _id: result.insertedId };
      console.log('✅ Created test user');
    }

    const userId = testUser._id;
    console.log(`👤 Using user ID: ${userId}`);

    // Seed pets
    console.log('🐾 Seeding pets...');
    const pets = [
      {
        userId,
        name: 'Max',
        type: 'Dog',
        breed: 'Golden Retriever',
        birthDate: new Date('2020-05-15'),
        weight: 30,
        gender: 'Male',
        profilePhoto: 'https://example.com/max.jpg'
      },
      {
        userId,
        name: 'Luna',
        type: 'Cat',
        breed: 'Siamese',
        birthDate: new Date('2021-08-20'),
        weight: 4,
        gender: 'Female',
        profilePhoto: 'https://example.com/luna.jpg'
      }
    ];

    const createdPets = await PetModel.insertMany(pets);
    console.log(`✅ Created ${createdPets.length} pets`);

    // Seed health records
    console.log('🏥 Seeding health records...');
    const healthRecords = createdPets.map(pet => ({
      userId,
      petId: pet._id,
      type: 'Vaccination',
      title: 'Annual Vaccination',
      date: new Date(),
      vetName: 'Dr. Smith',
      cost: 100,
      nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      notes: 'Regular annual vaccination'
    }));

    await HealthRecordModel.insertMany(healthRecords);
    console.log(`✅ Created ${healthRecords.length} health records`);

    // Seed events
    console.log('📅 Seeding events...');
    const events = createdPets.map(pet => ({
      userId,
      petId: pet._id,
      title: 'Grooming Appointment',
      type: 'Grooming',
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
      location: 'Pet Grooming Salon',
      reminder: true,
      reminderTime: 60 // 60 minutes before
    }));

    await EventModel.insertMany(events);
    console.log(`✅ Created ${events.length} events`);

    // Seed feeding schedules
    console.log('🍽️ Seeding feeding schedules...');
    const feedingSchedules = createdPets.map(pet => ({
      userId,
      petId: pet._id,
      time: '08:00',
      foodType: 'Dry Food',
      amount: 200,
      unit: 'grams',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      active: true
    }));

    await FeedingScheduleModel.insertMany(feedingSchedules);
    console.log(`✅ Created ${feedingSchedules.length} feeding schedules`);

    // Seed expenses
    console.log('💰 Seeding expenses...');
    const expenses = createdPets.map(pet => ({
      userId,
      petId: pet._id,
      category: 'Food',
      amount: 50,
      currency: 'USD',
      paymentMethod: 'Credit Card',
      date: new Date(),
      description: 'Monthly pet food supply'
    }));

    await ExpenseModel.insertMany(expenses);
    console.log(`✅ Created ${expenses.length} expenses`);

    // Seed user budget
    console.log('💳 Seeding user budget...');
    await UserBudgetModel.create({
      userId,
      monthlyLimit: 500,
      alertThreshold: 0.8,
      categories: {
        Food: { limit: 200, spent: 50 },
        Healthcare: { limit: 150, spent: 100 },
        Grooming: { limit: 100, spent: 0 },
        Toys: { limit: 50, spent: 0 }
      }
    });
    console.log('✅ Created user budget');

    // Seed subscription
    console.log('📋 Seeding subscription...');
    await SubscriptionModel.create({
      userId,
      provider: 'stripe',
      tier: 'premium',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false
    });
    console.log('✅ Created subscription');

    await client.close();
    await mongoose.connection.close();

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Pets: ${createdPets.length}`);
    console.log(`   - Health Records: ${healthRecords.length}`);
    console.log(`   - Events: ${events.length}`);
    console.log(`   - Feeding Schedules: ${feedingSchedules.length}`);
    console.log(`   - Expenses: ${expenses.length}`);
    console.log('   - User Budget: 1');
    console.log('   - Subscription: 1');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();