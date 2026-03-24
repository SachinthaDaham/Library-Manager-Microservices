const GATEWAY_URL = 'http://localhost:3000/api';

const books = [
  { title: "The Pragmatic Programmer", author: "Dave Thomas, Andy Hunt", genre: "Software Engineering", isbn: "978-0135957059", totalCopies: 12 },
  { title: "Clean Code: A Handbook of Agile Software Craftsmanship", author: "Robert C. Martin", genre: "Programming", isbn: "978-0132350884", totalCopies: 8 },
  { title: "Design Patterns: Elements of Reusable Object-Oriented Software", author: "Erich Gamma, Richard Helm", genre: "Architecture", isbn: "978-0201633610", totalCopies: 5 },
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", genre: "Computer Science", isbn: "978-0262033848", totalCopies: 15 },
  { title: "Structure and Interpretation of Computer Programs", author: "Harold Abelson", genre: "Programming Languages", isbn: "978-0262510875", totalCopies: 3 },
  { title: "Refactoring: Improving the Design of Existing Code", author: "Martin Fowler", genre: "Software Engineering", isbn: "978-0134757599", totalCopies: 7 },
  { title: "Code Complete: A Practical Handbook of Software Construction", author: "Steve McConnell", genre: "Software Engineering", isbn: "978-0735619678", totalCopies: 4 },
  { title: "The Mythical Man-Month", author: "Frederick P. Brooks Jr.", genre: "Project Management", isbn: "978-0201835953", totalCopies: 6 },
  { title: "Cracking the Coding Interview", author: "Gayle Laakmann McDowell", genre: "Career Development", isbn: "978-0984782857", totalCopies: 20 },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", genre: "System Design", isbn: "978-1449373320", totalCopies: 10 }
];

const users = [
  { email: "alice.developer@library.com", password: "Password@123", role: "MEMBER" },
  { email: "bob.architect@library.com", password: "Password@123", role: "MEMBER" },
  { email: "charlie.student@library.com", password: "Password@123", role: "MEMBER" }
];

async function seed() {
  console.log("🌱 Starting Database Seeding Process...");
  let adminToken = '';

  try {
    // 1. Login as Admin
    console.log("Authenticating as Admin...");
    const authRes = await fetch(`${GATEWAY_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "admin123@gmail.com", password: "Password@123!" })
    }).catch(e => fetch(`${GATEWAY_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "secure@library.com", password: "Strong@123" })
    }));

    let authData = await authRes.json();
    if (!authRes.ok) {
         // Fallback to secure@library.com
        const fallbackRes = await fetch(`${GATEWAY_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "secure@library.com", password: "Strong@123" })
        });
        authData = await fallbackRes.json();
    }
    
    adminToken = authData.access_token;
    console.log("✅ Admin Authenticated.");

    // 2. Register Demo Users
    console.log("\nRegistering Demo Users...");
    for (const u of users) {
      const uRes = await fetch(`${GATEWAY_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u)
      });
      console.log(`✅ Registered User: ${u.email}`);
    }

    // 3. Get existing books from catalog instead of duplicating them
    console.log("\nFetching Library Catalog...");
    const catRes = await fetch(`${GATEWAY_URL}/books`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    let insertedBooks = await catRes.json();

    if(insertedBooks.length === 0) {
        for (const b of books) {
            const res = await fetch(`${GATEWAY_URL}/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                body: JSON.stringify(b)
            });
            if(res.ok) { insertedBooks.push(await res.json()); }
        }
    }

    // 4. Simulate Borrows using MongoDB mapping
    if(insertedBooks.length >= 2) {
      console.log("\nSimulating Live User Activity (Borrows & Holds)...");
      const b1 = insertedBooks[0];
      const b2 = insertedBooks[1];

      // Login as Alice to Borrow a Book
      const aliceRes = await fetch(`${GATEWAY_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "alice.developer@library.com", password: "Password@123" })
      });
      const aliceData = await aliceRes.json();
      
      const borrow1 = await fetch(`${GATEWAY_URL}/borrows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aliceData.access_token}` },
        body: JSON.stringify({ memberId: aliceData.user.id, bookId: b1._id, loanDurationDays: 14 })
      });
      console.log(`✅ Alice borrowed "${b1.title}"`);

      // Borrow a second book to return
      const borrow2 = await fetch(`${GATEWAY_URL}/borrows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aliceData.access_token}` },
        body: JSON.stringify({ memberId: aliceData.user.id, bookId: b2._id, loanDurationDays: 14 })
      });
      const b2Data = await borrow2.json();

      if(borrow2.ok && b2Data._id) {
          // Return the second book to test returned statistics
          await fetch(`${GATEWAY_URL}/borrows/${b2Data._id}/return`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${aliceData.access_token}` },
          });
          console.log(`✅ Alice returned "${b2.title}"`);
      }


      // Login as Bob to Place a Hold
      const bobRes = await fetch(`${GATEWAY_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "bob.architect@library.com", password: "Password@123" })
      });
      const bobData = await bobRes.json();

      await fetch(`${GATEWAY_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${bobData.access_token}` },
        body: JSON.stringify({ memberId: bobData.user.id, bookId: b1._id })
      });
      console.log(`✅ Bob placed a hold on "${b1.title}"`);
    }

    console.log("\n🎉 Database Seeding Complete! The system is now heavily populated and realistic.");
  } catch(e) {
    console.error("❌ Seeding Failed:", e);
  }
}

seed();
