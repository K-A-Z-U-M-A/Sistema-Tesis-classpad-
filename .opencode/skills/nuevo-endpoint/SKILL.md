---
name: Nuevo endpoint
description: Anadir un endpoint REST completo en ClassPad (ruta backend + consumo desde web) siguiendo las convenciones del proyecto
---

# Añadir un endpoint REST completo

## Cuándo usar

Al crear funcionalidad nueva que necesita comunicación backend ↔ frontend.

## Workflow

### 1. Backend: el router

Crear o ampliar `backend/src/routes/<recurso>.js`. Patrón del proyecto:

```js
import express from 'express';
import pool from '../config/database.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Listar
router.get('/', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM mi_recurso ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (err) {
    console.error('Error listando mi_recurso:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
```

Reglas:
- Placeholders posicionales **siempre**: `WHERE id = $1` con `[id]`. Nunca interpolar.
- `authMiddleware` en todo salvo login, registro y recuperación.
- Rol de admin: comprobar `req.user.role` además del middleware.
- Errores: `return res.status(4xx).json({ error: '…' })`; en 500, `console.error`
  y mensaje genérico (nunca filtrar el detalle al cliente).

### 2. Registrar en `src/index.js`

```js
import miRecursoRoutes from './routes/miRecurso.js';
app.use('/api/mi-recurso', miRecursoRoutes);
```

Hay 19 routers montados. Prefijos en kebab-case. Si el recurso cuelga de otro
(p. ej. un backup dentro de admin), montarlo anidado: `app.use('/api/admin/backups', …)`.

### 3. Frontend: consumirlo

Usar el cliente propio en `web/src/services/api.js` (es una clase con `baseURL`,
**no axios**):

```js
const res = await api.get('/mi-recurso');
```

No introducir `fetch` ni `axios` en código nuevo.

### 4. Fechas

Si el endpoint maneja fechas, seguir la regla del proyecto: el backend compara
con `toLocaleDateString('sv-SE')` y el frontend parsea con un helper local tipo
`parseLocalDate()` (referencia: `web/src/pages/Courses/CourseCalendar.jsx:556`).
Nunca `new Date('YYYY-MM-DD')`, que en UTC-3 desplaza el día.

### 5. Verificar antes de dar por terminado

```bash
npm --prefix web run lint      # si toqué web/
npm --prefix backend run dev   # levantar y probar el endpoint
```

Probar el endpoint con `curl` o con los scripts de `backend/scripts/`
(`test-connection.js`, `test-login.js`, `test-api-login.js`).

## Checklist

- [ ] Router creado/ampliado con `pool.query` y `$1`
- [ ] `authMiddleware` aplicado
- [ ] Errores con `console.error` + `res.status(...).json({ error })`
- [ ] Montado en `src/index.js`
- [ ] Consumido desde `web/src/services/api.js`
- [ ] Fechas tratadas en hora local donde aplique
- [ ] `lint` de web pasado
