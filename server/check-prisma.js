const { PrismaClient } = require('@prisma/client');

async function test() {
  try {
    const prisma = new PrismaClient();
    console.log('Finding user...');
    const user = await prisma.user.findFirst();
    console.log('Result:', user);
  } catch (e) {
    console.error('Error running query:', e);
  }
}
test();
