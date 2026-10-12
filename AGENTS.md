# ClassPad — Instrucciones para agentes

Sistema de gestión educativa (tesis). Monorepo: API **Express + PostgreSQL** y SPA
**React 18 + Vite + MUI 5**. Node >= 18. Backend ESM sin TypeScript; web mezcla JSX y TSX.

## Mapa del repo

| Ruta | Contenido |
|---|---|
| `backend/src/routes/` | 19 routers Express (auth, users, courses, units, assignments, submissions, attendance, calendar, grades, messages, notifications, reports, roles, audit, backups, students, teachers, admin, passwordRecovery) |
| `backend/src/migrations/` | Migraciones SQL numeradas `001`–`019`. `migrate.js` las aplica en orden |
| `backend/src/services/` | `backupService` (Google Drive), `excelService`, `storage` |
| `backend/services/` | `EmailService` (SMTP), `PasswordService`, `TokenService` — fuera de `src/` |
| `backend/src/config/` | `database.js` (pool `pg`), `env.js`, `multer.js`, `passport.js` |
| `backend/scripts/` | utilidades manuales: `test-connection.js`, `test-login.js`, `check-users.js`… |
| `web/src/pages/` | Módulos: `auth`, `Dashboard`, `Courses`, `Assignments`, `Attendance`, `Messages`, `People`, `Profile`, `Settings`, `Admin`, `Manage`, `StudentProgress` |
| `web/src/components/` | `layout`, `auth`, `Notifications`, `profile`, `settings`, `ui` + componentes sueltos |
| `web/src/contexts/AuthContext.tsx` | Estado de sesión y rol |
| `web/src/services/api.js` | Cliente HTTP propio (clase con `baseURL`, **no axios**) |
| `web/src/services/sessionManager.js` | Gestión de expiración de sesión |
| `tests-e2e/` | Playwright + análisis de usabilidad (SUS) |
| `analysis/` | Métricas y figuras de resultados |

Detalle por área en `backend/AGENTS.md` y `web/AGENTS.md`.

## Comandos

```bash
npm run dev              # web (:5173) + backend (:3001) con concurrently
npm install:all          # instala raíz, web y backend
npm --prefix backend run migrate    # aplica migraciones SQL
npm --prefix web run lint           # ESLint (falla con --max-warnings 0)
npm run test:e2e                  # Playwright headless
npm run test:e2e:headed           # Playwright con navegador visible
```

## Convenciones

- **Backend ESM.** `import express from 'express'`. Rutas registradas en `backend/src/index.js`.
- **Consultas** con `pool.query` y placeholders posicionales `$1`, `$2`… (nunca interpolación).
- **Errores**: `return res.status(4xx).json({ error: '...' })`; 500 con `console.error` y mensaje genérico.
- **Fechas**: guardar en UTC. Para comparar o mostrar un día concreto, evitar `new Date('YYYY-MM-DD')`
  porque UTC-media noche desplaza el día en husos negativos (Paraguay es UTC-3).
  - Backend: `original_date.toLocaleDateString('sv-SE')` → `YYYY-MM-DD` en hora local.
  - Frontend: helper local tipo `parseLocalDate()` (ver `web/src/pages/Courses/CourseCalendar.jsx:556`).
- **Frontend**: componentes función, `sx` de MUI para estilos, tema en `web/src/theme/`.
  Rutas lazy con `React.lazy` salvo el `Dashboard`, que es eager a propósito.
- **Migraciones**: añadir con el siguiente número libre, nunca editar una ya aplicada.

## Git y PowerShell (trampas de este entorno)

- **`git reset` anula un `git rm --cached` previo.** Si des-trackeas un archivo,
  haces `reset` y commiteas, sigue trackeado. Tras commitear, verifica con
  `git ls-tree -r --name-only HEAD | grep <ruta>`.
- **Los heredocs `<<EOF` no funcionan en PowerShell.** Para mensajes de commit
  multilínea usa `git commit -F <archivo>`.
- **`git filter-repo` y Python no están instalados.** Para reescribir historial
  usar `git filter-branch --tree-filter "node script.js"`; ~57 commits tardan
  unos 2 minutos. Deja un `.git-rewrite/` que hay que borrar después.
- **GitHub rechaza el push si hay secretos en cualquier commit** (push
  protection), aunque el archivo ya no exista en HEAD. Ver skill `purgar-secretos`.

## Verificación obligatoria

1. Si toco `web/` → `npm --prefix web run lint` antes de dar algo por terminado.
2. Si toco `backend/` → arrancar `npm run dev` y probar el endpoint afectado.
3. Si añado migración → NO ejecutarla contra la base real sin confirmación explícita.
4. Si toco `backend/.env*` o `tests-e2e/usability/data/*.csv` → prohibido leerlos o commitearlos.

## Seguridad — leer antes de tocar nada

- El repo es **público**. El historial de `main` y `Rama-A` aún contiene `.env`,
  `configure-db.js` y `configure-database.js` con credenciales reales.
- **Credenciales pendientes de rotación** (expuestas públicamente): `JWT_SECRET`,
  `DB_PASSWORD`, `SMTP_PASS`, Client ID/Secret de Google OAuth.
- `JWT_SECRET` era `supersecret_jwt_key` en `backend/.env`: valor débil y conocido.
- `.env` está en `.gitignore`. Solo se lee `.env.example`. No volver a trackear `.env`.
- Tras purgar `feature/classpad-modern-ui` con `filter-branch`, los blobs antiguos siguen
  en GitHub accesibles por SHA: la rotación es la única mitigación real.
- Rama de respaldo local `backup-antes-purga` conserva commits pre-purga (con secretos).
