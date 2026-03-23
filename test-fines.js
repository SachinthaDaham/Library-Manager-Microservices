const axios = require('axios');
async function run() {
  console.log('Logging in to Gateway...');
  const login = await axios.post('http://localhost:3000/api/auth/login', {email:'secure@library.com', password:'Strong@123'});
  console.log('Triggering Borrow Service CRON job sweep...');
  const res = await axios.get('http://localhost:3003/borrows/stats', {headers:{Authorization:`Bearer ${login.data.access_token}`}});
  console.log('Sweep finished. Stats:', res.data);
}
run().catch(console.error);
