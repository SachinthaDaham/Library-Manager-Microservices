const mongoose = require('mongoose');
const fetch = require('node-fetch'); // Native fetch in Node 18+

const MONGODB_URI = 'mongodb+srv://f1admin:DGoSkGXpThvjkv2E@cluster0.gsu8i5s.mongodb.net/library-borrow-db?retryWrites=true&w=majority&appName=Cluster0';

// Borrow Schema
const borrowSchema = new mongoose.Schema({
  memberId: { type: String, required: true },
  bookId: { type: String, required: true },
  borrowDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['ACTIVE', 'RETURNED', 'OVERDUE'], default: 'ACTIVE' },
  returnDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

const Borrow = mongoose.model('Borrow', borrowSchema, 'borrows');

async function seedBorrows() {
  try {
    console.log('📡 Fetching real Members from Auth Service...');
    const usersRes = await fetch('http://localhost:3001/auth/users');
    const users = await usersRes.json();
    const members = users.filter(u => u.role === 'MEMBER');

    console.log('📡 Fetching real Books from Book Service...');
    const booksRes = await fetch('http://localhost:3002/books');
    const books = await booksRes.json();

    if (members.length === 0 || books.length === 0) {
        console.log('❌ You need at least 1 Member and 1 Book in the system to seed borrows!');
        process.exit();
    }

    console.log('🔌 Connecting to Borrow Database...');
    await mongoose.connect(MONGODB_URI);

    // Clear existing borrows to start fresh? Let's just append.
    console.log('🌱 Generating 30 seed records...');

    const newBorrows = [];

    // Helper to get random item
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const now = new Date();

    // 10 ACTIVE (Future due date)
    for (let i = 0; i < 10; i++) {
      const borrowDate = new Date();
      borrowDate.setDate(now.getDate() - Math.floor(Math.random() * 5)); // Borrowed recently
      const dueDate = new Date(borrowDate);
      dueDate.setDate(borrowDate.getDate() + 14); // Due in future

      newBorrows.push({
        memberId: getRandom(members)._id,
        bookId: getRandom(books)._id,
        borrowDate,
        dueDate,
        status: 'ACTIVE',
        notes: 'Seeded Active Record'
      });
    }

    // 10 OVERDUE (Past due date)
    for (let i = 0; i < 10; i++) {
        const borrowDate = new Date();
        borrowDate.setDate(now.getDate() - 30 - Math.floor(Math.random() * 20)); // Borrowed 30-50 days ago
        const dueDate = new Date(borrowDate);
        dueDate.setDate(borrowDate.getDate() + 14); // Due date was in the past
  
        newBorrows.push({
          memberId: getRandom(members)._id,
          bookId: getRandom(books)._id,
          borrowDate,
          dueDate,
          status: 'OVERDUE',
          notes: 'Seeded Overdue Record'
        });
      }

    // 10 RETURNED (Past due date or before, already returned)
    for (let i = 0; i < 10; i++) {
        const borrowDate = new Date();
        borrowDate.setDate(now.getDate() - 40 - Math.floor(Math.random() * 60)); // Borrowed long time ago
        const dueDate = new Date(borrowDate);
        dueDate.setDate(borrowDate.getDate() + 14); 
        
        const returnDate = new Date(borrowDate);
        returnDate.setDate(borrowDate.getDate() + Math.floor(Math.random() * 14)); // Returned within 14 days
  
        newBorrows.push({
          memberId: getRandom(members)._id,
          bookId: getRandom(books)._id,
          borrowDate,
          dueDate,
          returnDate,
          status: 'RETURNED',
          notes: 'Seeded Returned Record'
        });
      }

    await Borrow.insertMany(newBorrows);
    console.log('✅ Successfully inserted 30 borrow records (10 Active, 10 Overdue, 10 Returned)!');

  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
}

seedBorrows();
