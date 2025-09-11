import pkg from 'pg';
const { Pool } = pkg;

async function testCredentials(host, port, database, user, password) {
  console.log(`🔍 Testing: ${user}@${host}:${port}/${database}`);
  
  const pool = new Pool({
    host,
    port,
    database,
    user,
    password,
  });

  try {
    const client = await pool.connect();
    console.log('✅ SUCCESS! Credentials are correct');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    await pool.end();
    return false;
  }
}

async function testCommonCredentials() {
  console.log('🔧 Testing common PostgreSQL credentials...\n');
  
  const credentials = [
    { host: 'localhost', port: 5432, database: 'postgres', user: 'postgres', password: 'postgres' },
    { host: 'localhost', port: 5432, database: 'postgres', user: 'admin', password: 'admin' },
    { host: 'localhost', port: 5432, database: 'postgres', user: 'root', password: 'root' },
    { host: 'localhost', port: 5432, database: 'postgres', user: 'postgres', password: 'password' },
    { host: 'localhost', port: 5432, database: 'postgres', user: 'postgres', password: '123456' },
    { host: 'localhost', port: 5432, database: 'postgres', user: 'postgres', password: '' },
  ];
  
  for (const cred of credentials) {
    const success = await testCredentials(cred.host, cred.port, cred.database, cred.user, cred.password);
    if (success) {
      console.log(`\n🎉 Found working credentials:`);
      console.log(`   Host: ${cred.host}`);
      console.log(`   Port: ${cred.port}`);
      console.log(`   Database: ${cred.database}`);
      console.log(`   User: ${cred.user}`);
      console.log(`   Password: ${cred.password}`);
      break;
    }
    console.log(''); // Empty line for readability
  }
}

testCommonCredentials();
