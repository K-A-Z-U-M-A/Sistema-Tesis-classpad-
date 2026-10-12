# Web — React 18 + Vite + MUI 5

Complementa el `AGENTS.md` de la raíz. Se aplica a todo lo que hay bajo `web/`.

## Layout

```
web/src/
├── main.jsx / App.jsx      ← App.jsx: Router + ThemeProvider + rutas lazy
├── theme/                  ← tema MUI (paleta, tipografía)
├── contexts/AuthContext.tsx ← sesión, usuario y rol actuales
├── stores/authStore.ts     ← store zustand de auth
├── services/api.js         ← cliente HTTP propio (clase, NO axios)
├── services/sessionManager.js ← expiración/renovación de sesión
├── hooks/                  ← p. ej. useAssignmentCount
├── components/
│   ├── layout/AppLayout.jsx ← shell con drawer + topbar (síncrono, se usa en casi todo)
│   ├── auth/ profile/ settings/ ui/ Notifications/
│   └── *.jsx               ← componentes compartidos (QR, mapas, subidas…)
├── pages/                  ← una carpeta por módulo
└── types/                  ← tipos TS compartidos
```

## Rutas

Declaradas en `App.jsx`. Dos comportamientos a respetar:

- **Casi todo es `React.lazy`** (auth, cursos, tareas, admin…).
- **`Dashboard` es eager** a propósito: elimina un waterfall de `Suspense` en `/dashboard`.
  No lo conviertas en lazy.
- `AppLayout` se importa de forma síncrona porque envuelve la mayoría de rutas.

## Cliente HTTP

`services/api.js` es una **clase propia** con `baseURL`, no axios. Úsala así en
componentes nuevos; no introduzcas `fetch` ni axios por tu cuenta. Los tokens de
sesión los gestiona `sessionManager.js`, que se inyecta en la clase.

## Fechas y zonas horarias

Regla del proyecto: **almacenar UTC, presentar en hora local**. El backend devuelve
fechas tipo `YYYY-MM-DD` o ISO; `new Date(str)` interpreta como UTC y en husos
negativos (Paraguay, UTC-3) desplaza el día uno hacia atrás.

Usar un helper local como el de `pages/Courses/CourseCalendar.jsx:556`:

```js
const parseLocalDate = (str) => { /* parte 'YYYY-MM-DD' y construye la fecha en local */ };
```

Si necesitas el mismo helper en otra página, extraelo a `web/src/utils/parseLocalDate.js`
en lugar de copiarlo.

## Estilos y componentes

- Componentes función con hooks. Estilos con `sx` de MUI; no mezcles CSS modules.
- Paleta y tipografía salen del tema en `web/src/theme/`; no hardcodees colores salvo
  en casos puntuales ya existentes.
- Iconos: `@mui/icons-material` o `lucide-react`.

## Tipado

El proyecto es mixto JSX/TSX. Los ficheros `.ts`/`.tsx` existentes (`AuthContext.tsx`,
`stores/authStore.ts`, `types/index.ts`, `pages/**/*.tsx`) deben compilar con `tsc`.
En código nuevo usa TypeScript.

## Verificación

```bash
npm --prefix web run lint     # ESLint, --max-warnings 0: cualquier warning falla
npm --prefix web run build    # tsc && vite build
```

No des por terminado un cambio en `web/` sin haber pasado el `lint`.
