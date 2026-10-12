---
name: Purgar secretos
description: Protocolo para eliminar archivos o valores sensibles de todo el historial de una rama Git y empujar con force
---

# Purgar secretos del historial

## Cuándo usar

Cuando GitHub bloquea un push por secretos, o cuando hay que retirar un `.env`
o una credencial de todo el historial de una rama.

## Workflow

1. **Acotar el alcance real, no el reportado.** GitHub señala algunos commits,
   pero suele haber más:

   ```bash
   git log --oneline HEAD -S 'GOCSPX-'
   git grep -l 'GOCSPX' HEAD
   git log --oneline HEAD -- backend/.env
   ```

2. **Comprobar si ya está en el remoto.**
   `git log --oneline origin/<rama> -- <fichero>`.
   Si está, las credenciales ya son públicas: hay que rotarlas sí o sí.

3. **Escribir el script de purga** (`node`). Unifica:

   - `fs.rmSync` para ficheros que nunca debieron versionarse (`.env`),
   - `s.replace(/patron-del-secreto/g, 'placeholder')` para credenciales
     incrustadas en ficheros que sí deben conservarse.

   Preferir depurar el valor antes que borrar el fichero: así la herramienta
   sigue funcionando y no se pierde funcionalidad.

4. **Validar en un clon desechable ANTES de tocar el repo real:**

   ```bash
   git clone --no-local --branch <rama> . <dir-temporal>
   git -C <dir-temporal> filter-branch --force --tree-filter "node script.js" -- <base>..HEAD
   ```

   Comprobar en el clon: patrones de secreto a 0, estructura conservada,
   commits intactos y limpiezas previas todavía aplicadas.

5. **Rama de respaldo:** `git branch backup-antes-purga HEAD`.

6. **Aplicar** el mismo `filter-branch` en el repo real. Unos 57 commits tardan
   ~2 minutos con `--tree-filter`.

7. **Verificar y empujar:**

   ```bash
   git log --oneline HEAD -S '<patron>'      # debe salir vacío
   git ls-tree -r --name-only HEAD | grep <ruta>
   git push --force-with-lease origin <rama>
   ```

## Trampas

- **`git reset` deshace `git rm --cached`.** Si necesitas separar en varios
  commits, haz los `rm --cached` al final o commitea en un solo paso.
- **`filter-branch` recrea `.git-rewrite/`** (ya está en `.gitignore`): bórralo.
- **`--force-with-lease`**, nunca `--force` pelado: aborta si alguien más empujó.
- **Purgar no des-expone.** Los blobs antiguos siguen en GitHub accesibles por
  SHA. La rotación de credenciales es la única mitigación real.
- **Revisa las demás ramas.** Purgar `feature/x` no afecta a `main` ni a otras.
- Si el remoto y el local divergen por una reescritura previa, confirma la
  equivalencia antes de forzar:
  `git diff --quiet <commit-local> <commit-remoto>` → árboles idénticos.
