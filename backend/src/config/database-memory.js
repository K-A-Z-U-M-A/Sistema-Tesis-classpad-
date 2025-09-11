// In-memory database for testing
let users = [];
let nextId = 1;

const pool = {
  query: (sql, params = []) => {
    try {
      console.log('Executing SQL:', sql, 'with params:', params);
      
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        let results = users;
        
        // Simple WHERE clause parsing for email
        if (sql.includes('WHERE email = $1')) {
          results = users.filter(user => user.email === params[0]);
        } else if (sql.includes('WHERE id = $1')) {
          results = users.filter(user => user.id === params[0]);
        }
        
        return { rows: results };
      } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const newUser = {
          id: nextId++,
          email: params[0],
          display_name: params[1],
          password_hash: params[2],
          provider: params[3],
          role: params[4],
          is_active: params[5],
          created_at: new Date().toISOString(),
          last_login: null,
          photo_url: null
        };
        
        users.push(newUser);
        return { rows: [newUser] };
      } else if (sql.trim().toUpperCase().startsWith('UPDATE')) {
        // Handle different UPDATE patterns
        if (sql.includes('WHERE email = $1')) {
          const email = params[params.length - 1];
          const userIndex = users.findIndex(user => user.email === email);
          
          if (userIndex !== -1) {
            // Simple update logic
            if (sql.includes('last_login = NOW()')) {
              users[userIndex].last_login = new Date().toISOString();
            }
            if (sql.includes('provider = $1')) {
              users[userIndex].provider = params[0];
            }
            if (sql.includes('photo_url = $1')) {
              users[userIndex].photo_url = params[1];
            }
            
            return { rows: [users[userIndex]] };
          }
        } else if (sql.includes('WHERE id = $1')) {
          const userId = params[params.length - 1];
          const userIndex = users.findIndex(user => user.id === userId);
          
          if (userIndex !== -1) {
            // Simple update logic
            if (sql.includes('last_login = NOW()')) {
              users[userIndex].last_login = new Date().toISOString();
            }
            if (sql.includes('provider = $1')) {
              users[userIndex].provider = params[0];
            }
            if (sql.includes('photo_url = $1')) {
              users[userIndex].photo_url = params[1];
            }
            
            return { rows: [users[userIndex]] };
          }
        }
        
        return { rows: [] };
      }
      
      return { rows: [] };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },
  end: () => {
    console.log('Database connection closed');
  }
};

console.log('In-memory database initialized');

export default pool;
