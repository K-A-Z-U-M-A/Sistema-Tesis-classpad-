# ClassPad E2E – Suite de Evaluación de Calidad y Usabilidad

Esta carpeta contiene la suite completa de evaluación de ClassPad, estructurada en dos
dimensiones metodológicamente distintas:

- **A. Pruebas automatizadas E2E** con [Playwright](https://playwright.dev/)
- **B. Instrumentos de evaluación de usabilidad** con usuarios reales (SUS)

---

## Estructura

```
tests-e2e/
├── tests/                         # 13 specs E2E
│   ├── 01-auth.spec.js            # Autenticación (login, logout, rutas protegidas)
│   ├── 02-admin-users.spec.js     # Gestión de usuarios (admin)
│   ├── 03-teacher-courses.spec.js # Gestión de cursos (profesor)
│   ├── 04-teacher-assignments.spec.js  # Tareas y trabajos (profesor)
│   ├── 05-student-enrollment.spec.js   # Inscripciones (alumno)
│   ├── 06-student-submissions.spec.js  # Entregas (alumno)
│   ├── 07-attendance.spec.js      # Asistencia
│   ├── 08-grades.spec.js          # Calificaciones
│   ├── 09-messages-notifications.spec.js  # Mensajes
│   ├── 10-audit-reports.spec.js   # Auditoría y reportes
│   ├── 11-validation-errors.spec.js   # Validación de formularios
│   ├── 12-responsive.spec.js      # Responsividad (desktop/tablet/móvil)
│   └── 13-accessibility.spec.js   # Accesibilidad WCAG 2.1 (axe-core)
│
├── fixtures/
│   ├── auth.fixture.js            # Fixture multi-rol (adminPage, teacherPage, studentPage)
│   └── test-data.fixture.js       # Datos de prueba estáticos
│
├── helpers/
│   ├── selectors.helper.js        # Localizadores semánticos
│   ├── api.helper.js              # Helper de API REST
│   ├── metrics.helper.js          # Captura y persistencia de métricas de performance
│   └── database.helper.js         # Helper de base de datos (verificación)
│
├── analysis/
│   ├── requirements.txt           # Dependencias Python
│   ├── analyze_playwright_results.py  # Genera Figuras 1, 2, 3 + resumen estadístico
│   └── analyze_human_usability.py    # Calcula SUS + genera Figura 4
│
├── usability/
│   ├── participant-guide.md       # Guía para participantes
│   ├── moderator-guide.md         # Protocolo del evaluador
│   ├── tasks.md                   # Tareas de la sesión
│   ├── sus-questionnaire.md       # Cuestionario SUS imprimible
│   ├── consent-template.md        # Formulario de consentimiento
│   ├── observations-template.csv  # Planilla de observaciones
│   ├── sus-responses-template.csv # Plantilla de respuestas SUS
│   └── methodology.md             # Documento metodológico para la tesis
│
├── .env.example                   # Variables de entorno necesarias
├── playwright.config.js           # Configuración de Playwright
├── global-setup.js                # Setup global (verificación de seguridad)
├── global-teardown.js             # Teardown global
└── README.md                      # Este archivo
```

---

## Requisitos previos

1. **Node.js** ≥ 18 y **npm** ≥ 9
2. **Python** ≥ 3.10 (para los scripts de análisis)
3. La aplicación debe estar corriendo:
   - Frontend: `https://localhost:5173`
   - Backend: `http://localhost:3001`
4. Copiar `.env.example` a `.env` y completar las variables

---

## Configuración inicial

```bash
# 1. Instalar dependencias de Node
npm --prefix tests-e2e install

# 2. Instalar navegadores de Playwright
npx --prefix tests-e2e playwright install chromium

# 3. Configurar variables de entorno
copy tests-e2e\.env.example tests-e2e\.env
# Editar .env con las credenciales de prueba

# 4. Instalar dependencias Python
pip install -r tests-e2e/analysis/requirements.txt
```

---

## Ejecución de pruebas

### Todas las pruebas (modo headless)
```bash
npm --prefix tests-e2e run test
```

### Con interfaz visual (debug)
```bash
npm --prefix tests-e2e run test:headed
```

### Suite específica
```bash
npm --prefix tests-e2e run test -- tests/01-auth.spec.js
```

### Solo accesibilidad
```bash
npm --prefix tests-e2e run test -- tests/13-accessibility.spec.js
```

### Modo UI interactivo
```bash
npm --prefix tests-e2e run test:ui
```

---

## Generación de figuras académicas

Una vez ejecutadas las pruebas:

```bash
# Figuras 1, 2, 3 + resumen estadístico (datos E2E)
python tests-e2e/analysis/analyze_playwright_results.py \
    --metrics tests-e2e/test-results/metrics/performance-metrics.json \
    --results tests-e2e/playwright-report/results.json \
    --output tests-e2e/analysis/

# Figura 4 + análisis SUS (datos de usabilidad real)
# Requiere haber completado las sesiones y llenado sus-responses.csv
python tests-e2e/analysis/analyze_human_usability.py \
    --input tests-e2e/usability/sus-responses.csv \
    --output tests-e2e/analysis/
```

Las figuras se generan en `tests-e2e/analysis/` a **300 DPI**.

---

## Variables de entorno requeridas

| Variable | Descripción |
|---|---|
| `E2E_ALLOW_TEST_DATA` | **Obligatoria.** Debe ser `true` para ejecutar las pruebas |
| `PLAYWRIGHT_BASE_URL` | URL del frontend (default: `https://localhost:5173`) |
| `E2E_ADMIN_EMAIL` | Email del usuario administrador de prueba |
| `E2E_ADMIN_PASSWORD` | Contraseña del administrador |
| `E2E_TEACHER_EMAIL` | Email del profesor de prueba |
| `E2E_TEACHER_PASSWORD` | Contraseña del profesor |
| `E2E_STUDENT_EMAIL` | Email del alumno de prueba |
| `E2E_STUDENT_PASSWORD` | Contraseña del alumno |

---

## Nota metodológica

> Las pruebas automatizadas evalúan **operabilidad técnica** del sistema.
> NO sustituyen ni simulan una evaluación de usabilidad con usuarios humanos reales.
> Los instrumentos en `usability/` son complementarios y deben ejecutarse en sesiones
> presenciales o remotas con participantes reales.
>
> Ver `usability/methodology.md` para la descripción metodológica completa.
