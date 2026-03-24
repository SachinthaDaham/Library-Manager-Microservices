const GATEWAY_URL = 'http://localhost:3000/api';

async function simulate() {
  console.log("Triggering live RabbitMQ events via Gateway Return Action...");
  
  // 1. Authenticate as Alice
  const aliceRes = await fetch(`${GATEWAY_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "alice.developer@library.com", password: "Password@123" })
  });
  const aliceData = await aliceRes.json();
  const aliceId = aliceData.user.id;
  const token = aliceData.access_token;

  // 2. Fetch Alice's active borrows
  const borrowsRes = await fetch(`${GATEWAY_URL}/borrows/member/${aliceId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const borrows = await borrowsRes.json();
  console.log(`Alice has ${borrows.length} borrows active.`);

  if (borrows.length > 0) {
    const borrowId = borrows[0].id;
    console.log(`Returning borrow ${borrowId} to trigger RabbitMQ...`);

    // 3. Return the book
    const returnRes = await fetch(`${GATEWAY_URL}/borrows/${borrowId}/return`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (returnRes.ok) {
        console.log("✅ Successfully sent return action. RabbitMQ should log 'book.returned' to Reservations and Notifications!");
    } else {
        const err = await returnRes.text();
        console.log("Return failed:", err);
    }
  } else {
      console.log("No borrows found for Alice to return.");
  }
}

simulate();
