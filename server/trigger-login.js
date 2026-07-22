fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@pos.com', password: 'admin123' })
}).then(async r => console.log(r.status, await r.text())).catch(console.error);
