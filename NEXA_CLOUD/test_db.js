const { Client } = require('pg');

async function test(pw) {
  const client = new Client({
    connectionString: `postgresql://postgres:${pw}@db.jkggifhpgvveybiryttj.supabase.co:5432/postgres`
  });
  
  try {
    await client.connect();
    console.log('SUCCESS with', pw);
    await client.end();
    process.exit(0);
  } catch(e) {
    console.log('FAILED with', pw, e.message);
  }
}

async function run() {
  await test('Aa@5356313');
  await test('Aa@53563136');
}

run();
