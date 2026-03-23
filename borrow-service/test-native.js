async function run() {
  const loginData = await fetch('http://localhost:3000/api/auth/login', {
      method: "POST", 
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email:'secure@library.com', password:'Strong@123'})
  }).then(r=>r.json());
  
  console.log('Got token:', loginData.access_token.substring(0, 15) + '...');
  
  const stats = await fetch('http://localhost:3003/borrows/stats', {
      headers:{Authorization:`Bearer ${loginData.access_token}`}
  }).then(r=>r.json());
  
  console.log('Stats sweep triggered:', stats);
}
run().catch(console.error);
