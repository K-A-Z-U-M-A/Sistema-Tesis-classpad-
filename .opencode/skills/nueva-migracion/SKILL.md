---
name: Nueva migracion
description: Crear una migracion SQL en backend/src/migrations siguiendo la numeracion y las convenciones del proyecto
---

# Crear una migración SQL en ClassPad

## Cuándo usar

Al añadir o modificar tablas, columnas, índices o triggers de PostgreSQL.
No usar para datos semilla (esos van en `backend/database/seeds/`).

## Workflow

1. **Comprobar el último número usado.**
   Listar `backend/src/migrations/*.sql` y tomar el siguiente libre. La numeración
   es correlativa y actualmente llega a `019`.

2. **Crear `backend/src/migrations/0NN_<descripcion_en_snake_case>.sql`.**
   Nombre descriptivo y en minúsculas: `020_add_x_to_courses.sql`.

3. **Escribir el SQL de forma idempotente** para que una reejecución no falle:

   ```sql
   CREATE TABLE IF NOT EXISTS mi_tabla (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   ALTER TABLE mi_tabla ADD COLUMN IF NOT EXISTS campo TEXT;

   CREATE INDEX IF NOT EXISTS idx_mi_tabla_campo ON mi_tabla(campo);
   ```

   Convenciones del proyecto:
   - `UUID` con `gen_random_uuid()` como identificador.
   - Fechas en `TIMESTAMPTZ` (se guarda en UTC).
   - Claves ajenas con `ON DELETE` explícito.
   - Si la migración toca `users`, revisar antes `018_drop_users_role_check.sql`
     y `019_update_puntaje_final_trigger.sql` para no contradecirlas.

4. **Verificar contra el esquema real antes de dar nada por hecho.**
   Ejecutar comprobaciones de sólo lectura:

   ```bash
   git grep -n "mi_tabla" HEAD -- backend/src
   ```

   Y confirmar en el código que la tabla se usa como se espera. No inventar
   columnas: buscar primero cómo las consume el backend.

5. **NO ejecutar la migración contra la base real.**
   `npm --prefix backend run migrate` aplica *todas* las pendientes y modifica
   datos. Requiere confirmación explícita del usuario. Si hace falta probar,
   proponer primero una copia de seguridad:

   ```bash
   pg_dump -U <usuario> -d <base> -F c -f backups/pre_migracion.dump
   ```

6. **Alternativa idempotente preferente.**
   Si el cambio es una tabla que el backend espera tener siempre, valorar
   añadirlo a un `backend/src/ensure-*.js` (que crea tablas si faltan al
   arrancar) en vez de una migración de un solo uso.

## Notas

- Nunca editar una migración ya aplicada: crear una nueva que la corrija.
- Si la migración cambia datos existentes, incluir un comentario con el
  `UPDATE` inverso o cómo revertirla.
- Tras crear la migración, actualizar `AGENTS.md` si cambia el mapa de tablas.
