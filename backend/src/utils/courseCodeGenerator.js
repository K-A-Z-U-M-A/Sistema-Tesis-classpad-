/**
 * Generate unique course codes
 */

/**
 * Generate a random course code
 * @returns {string} - 6 character alphanumeric code in uppercase
 */
export function generateCourseCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Check if a course code is unique
 * @param {string} code - The course code to check
 * @param {Object} pool - Database connection pool
 * @returns {Promise<boolean>} - True if code is unique
 */
export async function isCourseCodeUnique(code, pool) {
  try {
    const result = await pool.query(
      'SELECT id FROM courses WHERE course_code = $1',
      [code]
    );
    return result.rows.length === 0;
  } catch (error) {
    console.error('Error checking course code uniqueness:', error);
    return false;
  }
}

/**
 * Generate a unique course code
 * @param {Object} pool - Database connection pool
 * @returns {Promise<string>} - Unique course code
 */
export async function generateUniqueCourseCode(pool) {
  console.log('🔑 Starting course code generation...');
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generateCourseCode();
    console.log(`🔑 Attempt ${attempts + 1}: Generated code ${code}`);
    
    try {
      const isUnique = await isCourseCodeUnique(code, pool);
      console.log(`🔑 Code ${code} is unique:`, isUnique);
      
      if (isUnique) {
        console.log(`🔑 Success! Using code: ${code}`);
        return code;
      }
    } catch (error) {
      console.error('🔑 Error checking uniqueness:', error);
      throw error;
    }
    
    attempts++;
  }
  
  throw new Error('Unable to generate unique course code after maximum attempts');
}
