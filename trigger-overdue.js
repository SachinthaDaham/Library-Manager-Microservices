const mongoose = require('mongoose');
const fetch = require('node-fetch'); // Make sure node-fetch is available, or use native fetch if Node >= 18

const MONGODB_URI = 'mongodb+srv://f1admin:DGoSkGXpThvjkv2E@cluster0.gsu8i5s.mongodb.net/library-borrow-db?retryWrites=true&w=majority&appName=Cluster0';

async function triggerFakeOverdue() {
  console.log("⏳ Connecting to Borrow Database...");
  await mongoose.connect(MONGODB_URI);
  
  // Define Schema
  const borrowSchema = new mongoose.Schema({
    status: String,
    dueDate: Date
  }, { strict: false });
  const Borrow = mongoose.model('Borrow', borrowSchema, 'borrows');

  // Find an ACTIVE borrow
  const activeBorrow = await Borrow.findOne({ status: 'ACTIVE' });
  
  if (!activeBorrow) {
    console.log("❌ No ACTIVE borrows found. Please borrow a book from the dashboard first!");
    process.exit(0);
  }

  console.log(`✅ Found active borrow (ID: ${activeBorrow._id}).`);
  console.log("⏪ Rewinding its dueDate to yesterday...");
  
  // Set due date to yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  activeBorrow.dueDate = yesterday;
  await activeBorrow.save();

  console.log("✅ Due date updated in MongoDB!");

  // Now, call the Borrow API. The Borrow Service automatically checks for overdue books on any GET request!
  console.log("🔔 Triggering Borrow Service to detect the overdue book...");
  
  try {
    // Calling the service directly to trigger refreshOverdueStatuses()
    await fetch('http://localhost:3003/borrows');
    console.log("✅ Trigger sent! The Borrow Service should have emitted a 'book.overdue' RabbitMQ event.");
    console.log("🎉 Check the 'System Fines' and 'Event Logs' pages on your dashboard!");
  } catch (err) {
    console.log("Trigger error (Ignored):", err.message);
  }

  process.exit(0);
}

triggerFakeOverdue();
