import pool from '../../src/config/database.js';
import bcrypt from 'bcryptjs';

async function setupTeacherManual() {
    const client = await pool.connect();
    try {
        const email = 'abi@gmail.com';
        const password = 'Abigahil-12345';
        const displayName = 'Abigahil Profesora';

        console.log(`🔧 Configuring teacher: ${email}`);

        // 1. Create/Update Teacher
        const checkUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        let userId;

        if (checkUser.rows.length > 0) {
            userId = checkUser.rows[0].id;
            await client.query(
                `UPDATE users 
                 SET password_hash = $1, role = 'teacher', display_name = $2, provider = 'local', is_active = true
                 WHERE id = $3`,
                [passwordHash, displayName, userId]
            );
            console.log(`✅ User updated: ${userId}`);
        } else {
            const newUser = await client.query(
                `INSERT INTO users (email, display_name, password_hash, role, provider, is_active)
                 VALUES ($1, $2, $3, 'teacher', 'local', true)
                 RETURNING id`,
                [email.toLowerCase(), displayName, passwordHash]
            );
            userId = newUser.rows[0].id;
            console.log(`✅ User created: ${userId}`);
        }

        // 2. Ensure a Course exists
        const courseName = 'Matemáticas Avanzadas';
        const checkCourse = await client.query(
            'SELECT id FROM courses WHERE owner_id = $1 AND name = $2',
            [userId, courseName]
        );
        let courseId;

        if (checkCourse.rows.length > 0) {
            courseId = checkCourse.rows[0].id;
            console.log(`✅ Course exists: ${courseId}`);
        } else {
            const courseCode = 'M' + Math.floor(Math.random() * 10000);

            // Note: Adjust columns based on verified schema in courses.js
            const newCourse = await client.query(
                `INSERT INTO courses (name, description, turn, grade, semester, year, color, owner_id, course_code, is_active, archived)
                 VALUES ($1, 'Curso demostrativo', 'Manana', '5', '1', 2025, '#4F46E5', $2, $3, true, false)
                 RETURNING id`,
                [courseName, userId, courseCode]
            );
            courseId = newCourse.rows[0].id;

            // Add to course_teachers
            await client.query(
                `INSERT INTO course_teachers (course_id, teacher_id, role)
                 VALUES ($1, $2, 'owner')`,
                [courseId, userId]
            );

            console.log(`✅ Course created: ${courseId} (${courseCode})`);
        }

        console.log('🎉 Setup complete!');

    } catch (error) {
        console.error('❌ Error details:', error);
    } finally {
        client.release();
        pool.end();
    }
}

setupTeacherManual();
