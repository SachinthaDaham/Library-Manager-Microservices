const mongoose = require('mongoose');

// Mongoose connection string for library-borrow-db
const MONGODB_URI = 'mongodb+srv://f1admin:DGoSkGXpThvjkv2E@cluster0.gsu8i5s.mongodb.net/library-borrow-db?retryWrites=true&w=majority&appName=Cluster0';

// Borrow Schema matching the application's structure
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
    // 1. Fetch real Members directly from Auth Service
    console.log('📡 Fetching real Members from Auth Service...');
    const usersRes = await fetch('http://localhost:3001/auth/users');
    const users = await usersRes.json();
    const members = users.filter(u => u.role === 'MEMBER');

    // 2. Fetch real Books directly from Book Service
    console.log('📡 Fetching real Books from Book Service...');
    const booksRes = await fetch('http://localhost:3002/books');
    const books = await booksRes.json();

    if (members.length === 0 || books.length === 0) {
        console.log('❌ You need at least 1 Member and 1 Book manually created in the system to seed borrows!');
        process.exit();
    }

    // 3. Connect to Borrow Database
    console.log('🔌 Connecting to Borrow Database...');
    await mongoose.connect(MONGODB_URI);

    console.log('🌱 Generating 30 realistic seed records...');

    const newBorrows = [];
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const now = new Date();

    // -- GENERATE 10 ACTIVE BORROWS (Future due date) --
    for (let i = 0; i < 10; i++) {
      const borrowDate = new Date();
      borrowDate.setDate(now.getDate() - Math.floor(Math.random() * 5)); // Borrowed 0-5 days ago
      const dueDate = new Date(borrowDate);
      dueDate.setDate(borrowDate.getDate() + 14); // Due in the future

      newBorrows.push({
        memberId: getRandom(members)._id,
        bookId: getRandom(books)._id,
        borrowDate,
        dueDate,
        status: 'ACTIVE',
        notes: 'Auto-seeded Active Record'
      });
    }

    // -- GENERATE 10 OVERDUE BORROWS (Past due date) --
    for (let i = 0; i < 10; i++) {
        const borrowDate = new Date();
        borrowDate.setDate(now.getDate() - 30 - Math.floor(Math.random() * 20)); // Borrowed 30-50 days ago
        const dueDate = new Date(borrowDate);
        dueDate.setDate(borrowDate.getDate() + 14); // Due date is fully passed
  
        newBorrows.push({
          memberId: getRandom(members)._id,
          bookId: getRandom(books)._id,
          borrowDate,
          dueDate,
          status: 'OVERDUE',
          notes: 'Auto-seeded Overdue Record'
        });
      }

    // -- GENERATE 10 RETURNED BORROWS (History records) --
    for (let i = 0; i < 10; i++) {
        const borrowDate = new Date();
        borrowDate.setDate(now.getDate() - 40 - Math.floor(Math.random() * 60)); // Borrowed a long time ago
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
          notes: 'Auto-seeded Returned Record'
        });
      }

    // 4. Insert into MongoDB
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
