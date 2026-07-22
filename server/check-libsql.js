const { createClient } = require('@libsql/client');

try {
  const client = createClient({ url: 'file:../../supermarket.db' });
  client.execute('SELECT 1').then(console.log).catch(console.error);
} catch (e) {
  console.error('Error creating client:', e);
}
