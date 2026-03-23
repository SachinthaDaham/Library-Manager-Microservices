const axios = require('axios');

async function runTest() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'secure@library.com',
      password: 'Strong@123'
    });
    const token = loginRes.data.access_token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    console.log('Creating Book...');
    const bookRes = await axios.post('http://localhost:3002/books', {
      isbn: 'TEST-' + Math.floor(Math.random() * 10000),
      title: 'Microservices with Nest',
      author: 'Sach',
      genre: 'Tech',
      totalCopies: 1
    });
    const bookId = bookRes.data._id;
    console.log(`Created Book with ID: ${bookId}. Available: ${bookRes.data.availableCopies}`);

    console.log('Borrowing Book...');
    const borrowRes = await axios.post('http://localhost:3003/borrows', {
      memberId: 'member-001',
      bookId: bookId
    });
    console.log(`Borrowed Book! Borrow Record ID: ${borrowRes.data.id}`);

    console.log('Checking Book Availability in Catalog...');
    const checkRes = await axios.get(`http://localhost:3002/books/${bookId}`);
    console.log(`Available Copies After Borrow: ${checkRes.data.availableCopies}`);

    console.log('Returning Book...');
    await axios.put(`http://localhost:3003/borrows/${borrowRes.data.id}/return`, { notes: 'Done' });

    console.log('Checking Book Availability in Catalog...');
    const finalCheckRes = await axios.get(`http://localhost:3002/books/${bookId}`);
    console.log(`Available Copies After Return: ${finalCheckRes.data.availableCopies}`);

  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
  }
}

runTest();
