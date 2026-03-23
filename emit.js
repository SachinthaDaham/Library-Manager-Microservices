const { ClientRedis } = require('@nestjs/microservices');
const client = new ClientRedis({ host: 'localhost', port: 6379 });

async function run() {
  await client.connect();
  console.log('Connected to Redis');
  
  const result = client.emit('book.overdue', { 
    memberId: 'member-001', 
    borrowId: 'sample-borrow-002', 
    timestamp: new Date().toISOString() 
  });
  
  result.subscribe({
    next: () => console.log('Emitted book.overdue!'),
    error: (e) => console.error(e),
    complete: () => {
      console.log('Done');
      client.close();
    }
  });
}
run();
