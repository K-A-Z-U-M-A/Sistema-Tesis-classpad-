import pkg from 'pg';
const { Pool } = pkg;

async function testPostgreSQL() {
  console.log('🐘 Testing PostgreSQL connection...');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'classpad_bd',
    user: 'admin',
    password: 'admin',
  });

  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Check if our database exists
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      ['classpad_bd']
    );
    
    if (dbExists.rows.length === 0) {
      console.log('📝 Creating database classpad_bd...');
      await client.query(`CREATE DATABASE classpad_bd`);
      console.log('✅ Database created successfully');
    } else {
      console.log('✅ Database classpad_bd already exists');
    }
    
    client.release();
    await pool.end();
    
    console.log('🎉 PostgreSQL test completed successfully!');
    
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.log('\nPlease check:');
    console.log('1. PostgreSQL is running');
    console.log('2. Credentials are correct');
    console.log('3. Database exists or you have permission to create it');
  }
}

testPostgreSQL();
