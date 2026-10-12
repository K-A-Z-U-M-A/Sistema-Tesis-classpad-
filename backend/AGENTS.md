# Backend — Express + PostgreSQL

Complementa el `AGENTS.md` de la raíz. Se aplica a todo lo que hay bajo `backend/`.

## Layout

```
backend/
├── src/
│   ├── index.js            ← arranque: middlewares globales y registro de rutas
│   ├── config/             ← database.js (pool pg), env.js, multer.js, passport.js
│   ├── middleware/         ← authMiddleware.js (verifica JWT, expone req.user)
│   ├── migrations/         ← 001..019 SQL + migrate.js / migrate-factory.js
│   ├── routes/             ← 19 routers Express
│   ├── services/           ← backupService (Drive), excelService, storage
│   ├── utils/              ← jwt.js, uuid.js, courseCodeGenerator.js, avatarHelper.js
│   └── ensure-*.js         ← scripts idempotentes que crean tablas si faltan
├── services/               ← EmailService, PasswordService, TokenService
├── scripts/                ← utilidades manuales (test-*.js, check-users.js…)
├── database/seeds/         ← datos semilla (paraguay_holidays.sql…)
└── .env.example            ← plantilla; el .env real NUNCA se versiona
```

## Añadir un endpoint

1. Crear o editar el router en `src/routes/<recurso>.js`.
2. Importarlo en `src/index.js` y montarlo: `app.use('/api/<recurso>', rutas)`.
   Hay 19 routers montados; `auth` y `passwordRecovery` comparten el prefijo `/api/auth`.
3. Proteger con `authMiddleware` salvo login/registro/recuperación.
4. Para admin añadir además la comprobación de rol.

## Base de datos

Pool en `src/config/database.js`. **Siempre** placeholders posicionales:

```js
const r = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
res.json(r.rows);
```

Tablas del dominio: `users`, `courses`, `units`, `assignments`, `submissions`,
`submission_files`, `assignment_attachments`, `assignment_students`, `materials`,
`course_students`, `course_teachers`, `enrollments`, `student_grades`, `classrooms`,
`messages`, `message_attachments`, `comments`, `notifications`,
`attendance_sessions`, `attendance_records`, `attendance_holidays`.

Migración nueva → siguiente número libre (`020_*.sql`), `IF NOT EXISTS`/`ADD COLUMN IF NOT EXISTS`
donde aplique, y **no ejecutarla contra la base real sin confirmación**.
Los `ensure-*.js` de `src/` son el mecanismo idempotente para crear tablas al arrancar.

`users` no aparece en esa lista a propósito: se construye por capas con 8
migraciones de `ALTER TABLE` (001, 002, 003, 007, 011, 013, 018). **Nunca
inferas su esquema leyendo una sola migración.**

**Trampa de datos:** `submissions` admite varias filas por
`(student_id, assignment_id)` (una reentrega no borra la anterior). Para contar
entregas usa `COUNT(DISTINCT (student_id, assignment_id))`; referencia en
`src/routes/users.js:1717`.

## Variables de entorno

Definidas en `.env.example`: `DB_ENGINE`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
`DB_PASSWORD`, `PORT`, `CORS_ORIGIN`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`.

**Discrepancia conocida:** `SMTP_USER` y `SMTP_PASS` se usan en `services/EmailService.js`
pero faltan en `.env.example`. Si tocas el envío de correo, añádelas a la plantilla.

## Dónde está cada cosa "de servicio"

- `backend/services/EmailService.js` — nodemailer (SMTP).
- `backend/services/PasswordService.js` — hash/verificación de contraseñas.
- `backend/services/TokenService.js` — tokens de recuperación.
- `backend/src/services/backupService.js` — OAuth2 + subida a Google Drive.
- `backend/src/services/excelService.js` — exportación con exceljs.
- `backend/src/services/storage.js` — multer, rutas de subida.

No confundir `backend/services/` con `backend/src/services/`: son dos carpetas distintas.

## Debug

`npm --prefix backend run dev` (nodemon). Para probar un endpoint suelto hay scripts
listos en `backend/scripts/` (`test-connection.js`, `test-login.js`, `test-api-login.js`).
Antes de asumir que un bug es de base de datos, ejecutar `test-connection.js`.
