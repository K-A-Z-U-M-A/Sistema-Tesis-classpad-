/**
 * ============================================================
 * 🌱 CLASSPAD SEEDER — Datos de demostración completos y ricos
 * ============================================================
 * Ejecutar desde la raíz del backend:
 *   npm run seed
 *   (o: node src/seed.js)
 *
 * Incluye:
 *  1. Limpieza segura preservando:
 *     - admintest@gmail.com (Admin)
 *     - CesarR@classpad.com (Profesor Titular)
 *     - alumno.usab01@usab.test (Estudiante de Prueba)
 *  2. 6 Profesores activos (5 creados + Prof. César Rodríguez).
 *  3. 18 Cursos estructurados (3 de César titular + 15 de los 5 nuevos docentes).
 *  4. Calendario Escolar (school_calendars) y 12 a 14 Clases Programadas (course_calendar_classes) por curso.
 *  5. 4 Unidades didácticas temáticas y materiales de cátedra (materials) por curso.
 *  6. 51 Alumnos con matrículas (alumno.usab01@usab.test vinculado a los cursos de César y otras materias).
 *  7. DIVERSIDAD ESTADÍSTICA DE ASISTENCIA:
 *     - Grupo Sobresaliente (90-100% asistencias - incluye Esteban Ramírez)
 *     - Grupo Regular (75-85% asistencias)
 *     - Grupo En Alerta / Límite (60-70% asistencias)
 *     - Grupo En Riesgo Crítico (40-55% asistencias - no habilita)
 *  8. DIVERSIDAD DE ENTREGAS Y CALIFICACIONES:
 *     - 7 Evaluaciones por curso (3 Tareas, 2 Parciales, 2 TPs)
 *     - Submissions calificadas con dispersión real de notas y feedbacks
 *     - student_grades consolidado con alumnos Habilitados para Final, Habilitados para Recuperación y Reprobados
 * ============================================================
 */

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'classpad_bd',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// ── Correos protegidos que NUNCA se borran ────────────────────────────────────
const PROTECTED_EMAILS = [
  'admintest@gmail.com',
  'cesarr@classpad.com',
  'alumno.usab01@usab.test',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rndFloat = (min, max, decimals = 1) => {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const formatDateYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ── Datos de los 5 Nuevos Profesores ──────────────────────────────────────────
const TEACHER_DATA = [
  { name: 'Dra. Ana García',        email: 'ana.garcia@classpad.edu',      cedula: '12345001' },
  { name: 'Ing. Carlos Méndez',     email: 'carlos.mendez@classpad.edu',   cedula: '12345002' },
  { name: 'Lic. Laura Rodríguez',   email: 'laura.rodriguez@classpad.edu', cedula: '12345003' },
  { name: 'Dr. Martín López',       email: 'martin.lopez@classpad.edu',    cedula: '12345004' },
  { name: 'Mag. Sandra Torres',     email: 'sandra.torres@classpad.edu',   cedula: '12345005' },
];

// ── Plantillas de Cursos con Temarios y Unidades ──────────────────────────────
const COURSE_TEMPLATES = [
  // Cursos de Prof. César Rodríguez (CesarR@classpad.com) - Titular
  {
    code: 'ISO101', name: 'Ingeniería de Software I', turn: 'manana', grade: '1', color: '#0d47a1',
    pavilion: 1, floor: '2', num: 1, days: ['Lunes', 'Miércoles'], isCesar: true,
    units: [
      { title: 'Unidad 1: Fundamentos y Ciclos de Vida Ágiles', desc: 'Introducción al desarrollo de software profesional, Scrum, Kanban y gestión de requerimientos.' },
      { title: 'Unidad 2: Modelado de Dominio y Requisitos con UML', desc: 'Casos de uso, diagramas de clases, interacción y especificación técnica.' },
      { title: 'Unidad 3: Patrones de Diseño y Principios SOLID', desc: 'Arquitectura limpia, patrones creacionales, estructurales y buenas prácticas de código.' },
      { title: 'Unidad 4: Calidad, Testing y Entrega Continua', desc: 'Pruebas unitarias, integración continua, control de versiones y despliegue.' },
    ],
    classTopics: [
      'Introducción a la Ingeniería de Software y roles en un equipo ágil',
      'Metodologías Ágiles: Scrum, Ceremonias y Artefactos',
      'Ingeniería de Requerimientos: Historias de usuario y criterios de aceptación',
      'Modelado de Requerimientos: Diagramas de Casos de Uso',
      'Diagramas de Clases y Modelado Conceptual de Dominio',
      'Principios SOLID: Single Responsibility y Open/Closed',
      'Principios SOLID: Liskov, Interface Segregation y Dependency Inversion',
      'Patrones Creacionales: Singleton, Factory y Builder',
      'Patrones Estructurales: Adapter, Decorator y Facade',
      'Patrones de Comportamiento: Observer y Strategy',
      'Arquitectura en Capas y Clean Architecture',
      'Testing Unitario y TDD con Jest / Mocha',
    ]
  },
  {
    code: 'WEB201', name: 'Desarrollo Web Full Stack', turn: 'tarde', grade: '2', color: '#00838f',
    pavilion: 1, floor: '2', num: 2, days: ['Martes', 'Jueves'], isCesar: true,
    units: [
      { title: 'Unidad 1: Arquitectura Web y APIs RESTful', desc: 'Protocolo HTTP/S, diseño de endpoints REST, autenticación JWT y middleware en Node.js.' },
      { title: 'Unidad 2: Frontend Moderno con React', desc: 'Componentes funcionales, Hooks avanzados, gestión del estado y consumo de APIs.' },
      { title: 'Unidad 3: Persistencia y Bases de Datos', desc: 'Modelado relacional con PostgreSQL, migraciones, transacciones y ORM/Query Builders.' },
      { title: 'Unidad 4: Seguridad, Rendimiento y Despliegue', desc: 'CORS, sanitización, optimización de bundles Vite y despliegue cloud.' },
    ],
    classTopics: [
      'Fundamentos de Arquitectura Cliente-Servidor y Protocolo HTTP',
      'Desarrollo Backend con Node.js y Express: Creación de API REST',
      'Seguridad en APIs: Autenticación JWT, Hasheo bcrypt y Middlewares',
      'Validación de datos y manejo centralizado de errores en Node.js',
      'Introducción a React 18: JSX, Props y Componentes Reutilizables',
      'Hooks en React: useState, useEffect y useRef en profundidad',
      'Gestión de Estado Global: Context API y Zustand',
      'Enrutamiento SPA con React Router v6 y Layouts Dinámicos',
      'Bases de Datos Relacionales con PostgreSQL en Node.js',
      'Modelado de Tablas, Índices y Consultas Complejas con Joins',
      'Integración Frontend-Backend: Axios, interceptores y manejo de tokens',
      'Despliegue y Pruebas End-to-End de Aplicaciones Full Stack',
    ]
  },
  {
    code: 'CLO301', name: 'Arquitectura Cloud y DevOps', turn: 'noche', grade: '3', color: '#2e7d32',
    pavilion: 2, floor: '1', num: 3, days: ['Lunes', 'Viernes'], isCesar: true,
    units: [
      { title: 'Unidad 1: Fundamentos de Cloud Computing', desc: 'Modelos IaaS, PaaS, SaaS, proveedores principales y virtualización moderna.' },
      { title: 'Unidad 2: Contenedores con Docker', desc: 'Imágenes, Dockerfile, volúmenes, redes y Docker Compose multi-servicio.' },
      { title: 'Unidad 3: Integración y Despliegue Continuo (CI/CD)', desc: 'Pipelines con GitHub Actions, pruebas automatizadas y versionado semántico.' },
      { title: 'Unidad 4: Infraestructura como Código y Monitoreo', desc: 'Terraform, observabilidad, métricas, logging y alertas de producción.' },
    ],
    classTopics: [
      'Evolución del Hosting: De Servidores Dedicados a la Nube',
      'Modelos de Servicio Cloud y Arquitecturas de Alta Disponibilidad',
      'Introducción a Docker: Conceptos de Contenedor vs Máquina Virtual',
      'Creación de Imágenes con Dockerfile y Optimización Multi-Stage',
      'Orquestación Local con Docker Compose: Backend, Frontend y Base de Datos',
      'Almacenamiento Persistente y Redes en Contenedores',
      'Introducción a DevOps y Filosofía de Automatización Continua',
      'Pipelines de CI/CD: Configuración de GitHub Actions',
      'Automatización de Pruebas y Linters en el Pipeline de Integración',
      'Despliegue Automatizado a Servidores Cloud',
      'Monitoreo y Métricas de Salud del Sistema en Tiempo Real',
      'Estrategias de Backup, Disaster Recovery y Seguridad Cloud',
    ]
  },

  // Prof 1: Ana García (Ciencias Exactas)
  {
    code: 'MAT101', name: 'Matemáticas I', turn: 'manana', grade: '1', color: '#1976d2',
    pavilion: 1, floor: '1', num: 1, days: ['Lunes', 'Miércoles'], teacherIdx: 0,
    units: [
      { title: 'Unidad 1: Conjuntos y Números Reales', desc: 'Propiedades algebraicas, desigualdades e intervalos.' },
      { title: 'Unidad 2: Funciones y Modelado Matemático', desc: 'Funciones lineales, cuadráticas, exponenciales y logarítmicas.' },
      { title: 'Unidad 3: Límites y Continuidad', desc: 'Concepto formal de límite, asíntotas y continuidad de funciones.' },
      { title: 'Unidad 4: Introducción a la Derivada', desc: 'Definición geométrica, reglas de derivación y aplicaciones.' },
    ],
    classTopics: [
      'Sistemas de Números Reales y Axiomas de Cuerpo',
      'Desigualdades Lineales y Cuadráticas con Valor Absoluto',
      'Concepto de Función: Dominio, Rango y Gráficas',
      'Funciones Polinomiales y Racionales',
      'Funciones Exponenciales y Logarítmicas en Aplicaciones Prácticas',
      'Trigonometría Analítica y Círculo Unitario',
      'Concepto Intuitivo y Formal de Límite',
      'Cálculo de Límites Algebraicos e Indeterminaciones 0/0',
      'Límites al Infinito y Asíntotas Horizontales y Verticales',
      'Continuidad de Funciones y Teorema del Valor Intermedio',
      'La Derivada como Tasa de Cambio y Pendiente de la Recta Tangente',
      'Reglas Básicas de Derivación y Derivadas de Orden Superior',
    ]
  },
  {
    code: 'ALG201', name: 'Álgebra Lineal', turn: 'tarde', grade: '2', color: '#0288d1',
    pavilion: 1, floor: '1', num: 2, days: ['Martes', 'Jueves'], teacherIdx: 0,
    units: [
      { title: 'Unidad 1: Matrices y Sistemas Lineales', desc: 'Operaciones matriciales, eliminación de Gauss-Jordan y determinantes.' },
      { title: 'Unidad 2: Espacios Vectoriales', desc: 'Subespacios, independencia lineal, bases y dimensión.' },
      { title: 'Unidad 3: Transformaciones Lineales', desc: 'Núcleo, imagen, matriz de una transformación y cambio de base.' },
      { title: 'Unidad 4: Autovalores y Autovectores', desc: 'Polinomio característico, diagonalización y aplicaciones.' },
    ],
    classTopics: [
      'Sistemas de Ecuaciones Lineales y Matrices Aumentadas',
      'Método de Eliminación de Gauss y Gauss-Jordan',
      'Álgebra de Matrices: Suma, Producto y Matriz Transpuesta',
      'Matriz Inversa y Propiedades de Determinantes',
      'Espacios Vectoriales Reales y Propiedades Axiomáticas',
      'Subespacios Vectoriales y Combinaciones Lineales',
      'Independencia Lineal y Conjuntos Generadores',
      'Bases y Dimensión de un Espacio Vectorial',
      'Transformaciones Lineales: Definición y Propiedades',
      'Núcleo e Imagen de una Transformación Lineal',
      'Valores y Vectores Propios (Eigenvalues & Eigenvectors)',
      'Diagonalización de Matrices y Aplicaciones Prácticas',
    ]
  },
  {
    code: 'CAL301', name: 'Cálculo Diferencial', turn: 'noche', grade: '3', color: '#283593',
    pavilion: 1, floor: '2', num: 3, days: ['Lunes', 'Viernes'], teacherIdx: 0,
    units: [
      { title: 'Unidad 1: La Derivada y Técnicas de Diferenciación', desc: 'Regla de la cadena, diferenciación implícita y funciones inversas.' },
      { title: 'Unidad 2: Aplicaciones de la Derivada', desc: 'Tasas de cambio relacionadas, valores extremos y optimización.' },
      { title: 'Unidad 3: Análisis de Curvas y Teoremas de Valor Medio', desc: 'Concavidad, puntos de inflexión y Teorema de Rolle.' },
      { title: 'Unidad 4: Antiderivadas e Introducción a la Integral', desc: 'Sumas de Riemann y Teorema Fundamental del Cálculo.' },
    ],
    classTopics: [
      'Repaso de Límites y Derivadas Fundamentales',
      'La Regla de la Cadena para Funciones Compuestas',
      'Diferenciación Implícita y Derivadas de Funciones Inversas',
      'Derivadas de Funciones Logarítmicas y Exponenciales',
      'Tasas de Cambio Relacionadas en Geometría y Física',
      'Aproximaciones Lineales y Diferenciales',
      'Valores Máximos y Mínimos en Intervalos Cerrados',
      'El Teorema de Rolle y el Teorema del Valor Medio',
      'Criterio de la Primera y Segunda Derivada para Monotonía y Concavidad',
      'Trazado Preciso de Curvas y Asíntotas Oblicuas',
      'Problemas de Optimización en Ingeniería y Economía',
      'Antiderivadas y el Teorema Fundamental del Cálculo',
    ]
  },

  // Prof 2: Carlos Méndez (Física e Ingeniería)
  {
    code: 'FIS101', name: 'Física General', turn: 'manana', grade: '1', color: '#c62828',
    pavilion: 1, floor: '2', num: 4, days: ['Miércoles', 'Viernes'], teacherIdx: 1,
    units: [
      { title: 'Unidad 1: Cinemática en Una y Dos Dimensiones', desc: 'Posición, velocidad, aceleración y movimiento de proyectiles.' },
      { title: 'Unidad 2: Leyes de Newton y Dinámica', desc: 'Fuerza, masa, fricción y diagramas de cuerpo libre.' },
      { title: 'Unidad 3: Trabajo, Energía y Potencia', desc: 'Energía cinética, potencial, conservación de la energía mecánica.' },
      { title: 'Unidad 4: Momento Lineal y Choques', desc: 'Impulso, colisiones elásticas e inelásticas.' },
    ],
    classTopics: [
      'Unidades, Mediciones y Análisis Dimensional en Física',
      'Movimiento Rectilíneo Uniforme y Uniformemente Variado',
      'Caída Libre y Movimiento Vertical',
      'Vectores en el Espacio y Movimiento de Proyectiles (Tiro Parabólico)',
      'Primera y Segunda Ley de Newton: Fuerza y Aceleración',
      'Tercera Ley de Newton y Diagramas de Cuerpo Libre',
      'Fuerzas de Fricción Estática y Cinética',
      'Movimiento Circular Uniforme y Fuerza Centrípeta',
      'Trabajo Realizado por una Fuerza Constante y Variable',
      'Energía Cinética y el Teorema de Trabajo y Energía',
      'Fuerzas Conservativas y Conservación de la Energía Mecánica',
      'Momento Lineal, Impulso y Colisiones en Una y Dos Dimensiones',
    ]
  },
  {
    code: 'FIS201', name: 'Física Aplicada', turn: 'tarde', grade: '2', color: '#ad1457',
    pavilion: 2, floor: '1', num: 1, days: ['Martes', 'Jueves'], teacherIdx: 1,
    units: [
      { title: 'Unidad 1: Estática y Equilibrio de Cuerpos Rígidos', desc: 'Momento de torsión, centro de gravedad y condiciones de equilibrio.' },
      { title: 'Unidad 2: Mecánica de Fluidos', desc: 'Presión hidrostática, principio de Pascal, Arquímedes y ecuación de Bernoulli.' },
      { title: 'Unidad 3: Oscilaciones y Ondas Mecánicas', desc: 'Movimiento armónico simple, péndulo, ondas sonoras y efecto Doppler.' },
      { title: 'Unidad 4: Termometría y Calorimetría', desc: 'Temperatura, dilatación térmica, calor específico y cambio de fase.' },
    ],
    classTopics: [
      'Torque y Momento de una Fuerza respecto a un Punto',
      'Condiciones de Equilibrio Estático de Cuerpos Rígidos',
      'Centro de Masa y Centro de Gravedad en Estructuras',
      'Densidad, Presión Hidrostática y Principio de Pascal',
      'Principio de Arquímedes y Fuerza de Flotación',
      'Fluidos en Movimiento: Ecuación de Continuidad y Bernoulli',
      'Movimiento Armónico Simple (MAS) en Sistemas Masa-Resorte',
      'El Péndulo Simple y Físico en Pequeñas Oscilaciones',
      'Ondas Mecánicas Transversales y Longitudinales',
      'Ondas Sonoras, Intensidad Acústica y Efecto Doppler',
      'Escalas Termométricas y Dilatación Térmica de Materiales',
      'Calorimetría, Capacidad Calorífica y Calor Latente',
    ]
  },
  {
    code: 'MEC301', name: 'Mecánica y Termodinámica', turn: 'noche', grade: '3', color: '#6a1b9a',
    pavilion: 2, floor: '1', num: 2, days: ['Lunes', 'Miércoles'], teacherIdx: 1,
    units: [
      { title: 'Unidad 1: Primera Ley de la Termodinámica', desc: 'Sistemas termodinámicos, calor, trabajo y energía interna.' },
      { title: 'Unidad 2: Procesos con Gases Ideales', desc: 'Procesos isotérmicos, isobáricos, isocóricos y adiabáticos.' },
      { title: 'Unidad 3: Segunda Ley y Máquinas Térmicas', desc: 'Ciclo de Carnot, eficiencia térmica y entropía.' },
      { title: 'Unidad 4: Transferencia de Calor', desc: 'Conducción, convección y radiación térmica.' },
    ],
    classTopics: [
      'Sistemas Termodinámicos, Estado de Equilibrio y Ecuaciones de Estado',
      'Gases Ideales y Leyes de Boyle, Charles y Gay-Lussac',
      'Trabajo en Procesos de Expansión y Compresión de Fluidos',
      'Primera Ley de la Termodinámica: Conservación de la Energía',
      'Capacidades Caloríficas Molares y Relación de Mayer',
      'Procesos Adiabáticos y Politrópicos en Gases Ideales',
      'Segunda Ley de la Termodinámica y Máquinas Térmicas',
      'El Ciclo de Carnot y la Eficiencia Máxima Teórica',
      'Refrigeradores, Bombas de Calor y Rendimiento COP',
      'Concepto de Entropía y Principio del Aumento de la Entropía',
      'Conducción Térmica y Ley de Fourier en Paredes Compuestas',
      'Convección, Radiación Térmica y Ley de Stefan-Boltzmann',
    ]
  },

  // Prof 3: Laura Rodríguez (Lengua y Comunicación)
  {
    code: 'LEN101', name: 'Lengua y Comunicación I', turn: 'manana', grade: '1', color: '#2e7d32',
    pavilion: 2, floor: '2', num: 3, days: ['Martes', 'Viernes'], teacherIdx: 2,
    units: [
      { title: 'Unidad 1: La Comunicación Humana y sus Funciones', desc: 'Elementos del proceso comunicativo, funciones del lenguaje y barreras.' },
      { title: 'Unidad 2: Normativa Gramatical y Ortografía', desc: 'Acentuación, puntuación, concordancia y corrección de estilo.' },
      { title: 'Unidad 3: Tipologías Textuales', desc: 'Textos narrativos, descriptivos, expositivos y argumentativos.' },
      { title: 'Unidad 4: Comunicación Oral y Oratoria', desc: 'Estructura del discurso, lenguaje no verbal y argumentación oral.' },
    ],
    classTopics: [
      'El Circuito de la Comunicación y Funciones del Lenguaje de Jakobson',
      'Niveles de la Lengua: Coloquial, Estándar y Científico-Técnico',
      'Normas de Acentuación Gráfica: Agudas, Llanas, Esdrújulas y Tildación Diacrítica',
      'El Uso Correcto de Signos de Puntuación en Textos Académicos',
      'Concordancia Gramatical: Sujeto-Verbo y Sustantivo-Adjetivo',
      'Propiedades del Texto: Coherencia, Cohesión y Adecuación',
      'Estructura del Texto Expositivo y Métodos de Divulgación',
      'El Texto Argumentativo: Tesis, Argumentos y Contraargumentos',
      'Técnicas de Comprensión Lectora: Subrayado, Síntesis y Resumen',
      'Comunicación Oral Eficaz: Modulación, Dicción y Manejo Escénico',
      'El Lenguaje Corporal y la Kinésica en la Presentación Profesional',
      'Debate Académico: Estrategias de Refutación y Falacias Argumentativas',
    ]
  },
  {
    code: 'RED201', name: 'Redacción Académica', turn: 'tarde', grade: '2', color: '#388e3c',
    pavilion: 1, floor: '3', num: 1, days: ['Lunes', 'Jueves'], teacherIdx: 2,
    units: [
      { title: 'Unidad 1: El Párrafo y la Estructura Discursiva', desc: 'Idea principal, secundarias, conectores lógicos y transición.' },
      { title: 'Unidad 2: Géneros Académicos', desc: 'Ensayos, informes técnicos, monografías y artículos científicos.' },
      { title: 'Unidad 3: Normas de Citación y Honestidad Intelectual', desc: 'Normas APA 7ma edición, citas textuales, paráfrasis y antiplagio.' },
      { title: 'Unidad 4: Revisión, Estilo y Publicación', desc: 'Edición de textos, precisión léxica y redacción final.' },
    ],
    classTopics: [
      'Características del Estilo Académico: Claridad, Precisión y Objetividad',
      'El Párrafo como Unidad Temática: Estructura y Jerarquía de Ideas',
      'Conectores Lógicos y Marcadores del Discurso Textual',
      'El Ensayo Académico: Introducción, Desarrollo Argumental y Conclusión',
      'El Informe Técnico: Planteamiento del Problema, Metodología y Resultados',
      'La Monografía Científica: Fases de Investigación y Redacción',
      'Búsqueda de Información en Bases de Datos Científicas (Scopus, SciELO)',
      'Normas APA 7ma Edición: Citas Directas Cortas y en Bloque',
      'La Paráfrasis Rigurosa y Prevención del Plagio Académico',
      'Elaboración de Referencias Bibliográficas según Formato APA',
      'Revisión y Corrección de Estilo: Errores Comunes de Redacción',
      'Preparación de Manuscritos para Publicación y Ponencias',
    ]
  },
  {
    code: 'SEM301', name: 'Semiótica y Discurso', turn: 'noche', grade: '3', color: '#1b5e20',
    pavilion: 1, floor: '3', num: 2, days: ['Miércoles', 'Viernes'], teacherIdx: 2,
    units: [
      { title: 'Unidad 1: Fundamentos de la Semiótica', desc: 'Signo saussureano, tríada de Peirce e interpretación cultural.' },
      { title: 'Unidad 2: Análisis del Discurso', desc: 'Enunciación, ideología, poder y retórica contemporánea.' },
      { title: 'Unidad 3: Semiótica Visual y Multimodal', desc: 'Lectura de imágenes, diseño publicitario y cultura digital.' },
      { title: 'Unidad 4: Medios Masivos y Redes Sociales', desc: 'Construcción de noticias, posverdad y algoritmos comunicacionales.' },
    ],
    classTopics: [
      'Introducción a la Semiótica: Ferdinand de Saussure y el Signo Lingüístico',
      'La Tríada Semiótica de Charles Sanders Peirce: Signo, Objeto e Interpretante',
      'Denotación y Connotación en la Cultura Contemporánea',
      'Teoría de la Enunciación y Análisis Crítico del Discurso (ACD)',
      'Ideología y Discurso: Las Formas Simbólicas del Poder',
      'Retórica Clásica y Nuevas Figuras Retóricas en el Lenguaje Digital',
      'Semiótica de la Imagen: Códigos Espaciales, Cromáticos y Figurativos',
      'Semiótica del Diseño Gráfico y Publicidad Comercial',
      'Discurso Periodístico y Mecanismos de Construcción de la Realidad',
      'Posverdad, Fake News y Desinformación en Redes Digitales',
      'Semiótica de las Interfaces de Usuario (UI/UX) y Experiencia Digital',
      'Análisis Semiótico de Campañas Multimedia e Impacto Social',
    ]
  },

  // Prof 4: Martín López (Informática y Tecnología)
  {
    code: 'INF101', name: 'Algoritmos y Estructuras', turn: 'tarde', grade: '1', color: '#f57c00',
    pavilion: 2, floor: '3', num: 1, days: ['Lunes', 'Miércoles'], teacherIdx: 3,
    units: [
      { title: 'Unidad 1: Complejidad Algorítmica y Notación Big-O', desc: 'Análisis asintótico de tiempo y espacio, benchmarking.' },
      { title: 'Unidad 2: Estructuras de Datos Lineales', desc: 'Listas enlazadas simples/dobles, pilas (Stacks) y colas (Queues).' },
      { title: 'Unidad 3: Árboles y Estructuras Jerárquicas', desc: 'Árboles binarios de búsqueda, recorridos (in-order, pre-order) y balances AVL.' },
      { title: 'Unidad 4: Grafos y Algoritmos de Búsqueda', desc: 'Representación por matrices/listas, BFS, DFS y camino más corto (Dijkstra).' },
    ],
    classTopics: [
      'Introducción a los Algoritmos y Modelos de Cómputo',
      'Análisis de Complejidad: Notación Asintótica Big-O, Big-Omega y Big-Theta',
      'Arreglos Dinámicos vs Listas Simplemente Enlazadas',
      'Listas Doblemente Enlazadas y Listas Circulares',
      'Estructura Pila (LIFO): Implementación y Aplicaciones (Evaluación de Expresiones)',
      'Estructura Cola (FIFO) y Colas de Prioridad con Heaps',
      'Tablas Hash: Funciones Hash y Resolución de Colisiones',
      'Árboles Binarios: Definición, Propiedades y Recorridos',
      'Árboles Binarios de Búsqueda (BST): Inserción, Eliminación y Búsqueda',
      'Grafos: Representación con Matriz de Adyacencia y Lista de Adyacencia',
      'Algoritmos de Recorrido en Grafos: Búsqueda en Amplitud (BFS) y Profundidad (DFS)',
      'Algoritmo de Dijkstra para Caminos Mínimos en Grafos Ponderados',
    ]
  },
  {
    code: 'BDD201', name: 'Bases de Datos Relacionales', turn: 'noche', grade: '2', color: '#e65100',
    pavilion: 2, floor: '3', num: 2, days: ['Martes', 'Jueves'], teacherIdx: 3,
    units: [
      { title: 'Unidad 1: Modelo Entidad-Relación y Relacional', desc: 'Diagramas E/R, normalización (1FN, 2FN, 3FN) y claves primarias/foráneas.' },
      { title: 'Unidad 2: Lenguaje SQL Avanzado', desc: 'DML, DDL, DCL, subconsultas, agrupamientos y funciones analíticas.' },
      { title: 'Unidad 3: Transacciones, Concurrencia y ACID', desc: 'Niveles de aislamiento, bloqueos y control de concurrencia.' },
      { title: 'Unidad 4: Optimización, Índices y Vistas', desc: 'Planes de ejecución (EXPLAIN ANALYZE), índices B-Tree, triggers y procedimientos.' },
    ],
    classTopics: [
      'Introducción a los Sistemas de Gestión de Bases de Datos (SGBD)',
      'Modelado Conceptual: El Diagrama Entidad-Relación Extendido (EER)',
      'Transformación del Modelo EER al Esquema Relacional de Tablas',
      'Teoría de Normalización: Primera, Segunda y Tercera Forma Normal (3FN)',
      'Lenguaje SQL: Creación de Esquemas, Tablas y Restricciones de Integridad',
      'Consultas SQL Avanzadas con JOINs (Inner, Left, Right, Full Outer)',
      'Funciones de Agregación, Cláusulas GROUP BY y HAVING',
      'Subconsultas Correlacionadas y Expresiones de Tabla Comunes (CTEs)',
      'Propiedades ACID y Gestión de Transacciones (BEGIN, COMMIT, ROLLBACK)',
      'Niveles de Aislamiento Transaccional y Control de Concurrencia',
      'Índices B-Tree, Hash y Optimización con EXPLAIN ANALYZE',
      'Vistas Materializadas, Triggers y Funciones Almacenadas en PL/pgSQL',
    ]
  },
  {
    code: 'SIS301', name: 'Arquitectura de Sistemas', turn: 'manana', grade: '3', color: '#bf360c',
    pavilion: 1, floor: '4', num: 1, days: ['Lunes', 'Viernes'], teacherIdx: 3,
    units: [
      { title: 'Unidad 1: Patrones de Arquitectura Empresarial', desc: 'Monolito, microservicios, serverless y arquitectura orientada a eventos.' },
      { title: 'Unidad 2: Comunicación entre Servicios', desc: 'REST, gRPC, WebSockets y colas de mensajes (RabbitMQ/Kafka).' },
      { title: 'Unidad 3: Escalabilidad y Alta Disponibilidad', desc: 'Balanceo de carga, caching distribuido con Redis y particionamiento.' },
      { title: 'Unidad 4: Resiliencia y Mantenibilidad', desc: 'Circuit Breaker, Rate Limiting, observabilidad y trazabilidad distribuida.' },
    ],
    classTopics: [
      'Principios Fundamentales de la Arquitectura de Software a Gran Escala',
      'De Monolitos a Microservicios: Criterios de Descomposición de Dominios',
      'Diseño Guiado por el Dominio (Domain-Driven Design - DDD)',
      'Comunicación Síncrona vs Asíncrona entre Servicios',
      'Implementación de RPC de Alto Rendimiento con gRPC y Protocol Buffers',
      'Event-Driven Architecture: Productores, Consumidores y Event Brokers',
      'Estrategias de Caché Distribuido con Redis (Cache-Aside, Write-Through)',
      'Balanceadores de Carga de Capa 4 y Capa 7 (Nginx, HAProxy, AWS ALB)',
      'Particionamiento de Bases de Datos: Sharding y Réplicas de Lectura',
      'Patrones de Resiliencia: Circuit Breaker, Retry con Backoff y Timeout',
      'Seguridad en Microservicios: API Gateways y Tokens OAuth2/JWT',
      'Observabilidad Moderna: Logging Centralizado, Métricas y OpenTelemetry',
    ]
  },

  // Prof 5: Sandra Torres (Ciencias Humanas)
  {
    code: 'HIS101', name: 'Historia Contemporánea', turn: 'manana', grade: '1', color: '#4527a0',
    pavilion: 1, floor: '4', num: 2, days: ['Martes', 'Jueves'], teacherIdx: 4,
    units: [
      { title: 'Unidad 1: El Siglo XX y los Grandes Conflictos', desc: 'Primera y Segunda Guerra Mundial, fascismo y reordenamiento global.' },
      { title: 'Unidad 2: La Guerra Fría y el Orden Bipolar', desc: 'Bloques ideológicos, carrera armamentista y descolonización.' },
      { title: 'Unidad 3: América Latina en el Contexto Global', desc: 'Dictaduras de seguridad nacional, transiciones a la democracia e integración.' },
      { title: 'Unidad 4: El Mundo Globalizado del Siglo XXI', desc: 'Caída del muro de Berlín, era digital, crisis geopolíticas y multilateralismo.' },
    ],
    classTopics: [
      'El Escenario Geopolítico a Inicios del Siglo XX y la Gran Guerra (1914-1918)',
      'El Período de Entreguerras, la Gran Depresión de 1929 y el Auge de los Fascismos',
      'La Segunda Guerra Mundial: Fases Bélicas, Holocausto y Nuevas Fronteras',
      'La Creación de la ONU y la Declaración Universal de los Derechos Humanos',
      'La Guerra Fría: Configuración del Bloque Occidental y el Bloque Soviético',
      'Conflictos de la Guerra Fría: Guerra de Corea, Crisis de los Misiles y Vietnam',
      'Los Procesos de Descolonización en Asia y África durante la Posguerra',
      'América Latina en el Siglo XX: Doctrina de Seguridad Nacional y Gobiernos Militares',
      'Transiciones Democráticas en el Cono Sur y Creación del MERCOSUR',
      'El Colapso de la Unión Soviética y la Caída del Muro de Berlín (1989-1991)',
      'Globalización Económica, Revolución Digital y Nuevos Actores Internacionales',
      'Desafíos Globales del Siglo XXI: Cambio Climático, Migraciones y Multipolaridad',
    ]
  },
  {
    code: 'MET201', name: 'Metodología de la Investigación', turn: 'tarde', grade: '2', color: '#00695c',
    pavilion: 2, floor: '4', num: 1, days: ['Miércoles', 'Viernes'], teacherIdx: 4,
    units: [
      { title: 'Unidad 1: El Método Científico y Enfoques de Investigación', desc: 'Paradigmas cuantitativo, cualitativo y mixto en la ciencia.' },
      { title: 'Unidad 2: Planteamiento del Problema y Marco Teórico', desc: 'Preguntas de investigación, objetivos, justificación y revisión del arte.' },
      { title: 'Unidad 3: Diseño Metodológico y Muestreo', desc: 'Tipos de diseño (experimental/no experimental), población y técnicas de recolección.' },
      { title: 'Unidad 4: Análisis de Datos y Redacción del Informe', desc: 'Estadística descriptiva/inferencial, análisis cualitativo y conclusiones.' },
    ],
    classTopics: [
      'Epistemología y Origen del Conocimiento Científico',
      'Enfoques de Investigación: Cuantitativo, Cualitativo y Mixto',
      'Planteamiento del Problema: Formulación de Preguntas y Objetivos (SMART)',
      'Justificación, Viabilidad e Impacto de la Investigación Académica',
      'Construcción del Marco Teórico y Mapeo de la Literatura Científica',
      'Definición de Variables, Operacionalización e Hipótesis de Trabajo',
      'Diseños de Investigación Cuantitativos: Experimentales y No Experimentales',
      'Población, Tipos de Muestreo Probabilístico y No Probabilístico',
      'Técnicas de Recolección de Datos: Encuestas, Entrevistas y Observación',
      'Validación de Instrumentos: Juicio de Expertos y Confiabilidad (Alfa de Cronbach)',
      'Procesamiento y Análisis Estadístico de Datos Cuantitativos',
      'Estructura del Proyecto de Tesis y Pautas de Defensa Oral',
    ]
  },
  {
    code: 'ETI301', name: 'Ética Profesional y Ciudadana', turn: 'noche', grade: '3', color: '#37474f',
    pavilion: 2, floor: '4', num: 2, days: ['Lunes', 'Jueves'], teacherIdx: 4,
    units: [
      { title: 'Unidad 1: Fundamentos Éticos y Deontología', desc: 'Moral, ética, valores cívicos y códigos deontológicos profesionales.' },
      { title: 'Unidad 2: Responsabilidad Social y Ciudadanía', desc: 'Derechos humanos, justicia distributiva y compromiso social.' },
      { title: 'Unidad 3: Dilemas Éticos en la Práctica Profesional', desc: 'Confidencialidad, conflicto de intereses, bioética y honestidad.' },
      { title: 'Unidad 4: Ética en la Tecnología y la Inteligencia Artificial', desc: 'Privacidad de datos, algoritmos éticos, sesgos y futuro del trabajo.' },
    ],
    classTopics: [
      'Introducción a la Ética: Distinción entre Moral, Ética y Ley',
      'Corrientes Éticas Principales: Utilitarismo, Ética Deontológica y Virtudes',
      'La Deontología Profesional y la Función Social de la Universidad',
      'Códigos de Ética Profesional: Deberes, Sanciones y Compromisos',
      'Responsabilidad Social Universitaria y Compromiso Ciudadano',
      'Dilemas Éticos en el Ámbito Laboral: Casos Prácticos de Toma de Decisión',
      'Secreto Profesional, Confidencialidad y Manejo de Información Privilegiada',
      'Corrupción, Transparencia y Cultura de Integridad Institucional',
      'Ética de la Tecnología: Privacidad, Vigilancia y Protección de Datos Personales',
      'Inteligencia Artificial y Ética: Sesgos Algorítmicos y Responsabilidad Humana',
      'Sostenibilidad, Ética Ambiental y Compromiso con las Futuras Generaciones',
      'Hacia una Práctica Profesional Ética, Humanista y Transformadora',
    ]
  },
];

// ── Nombres para los 50 Alumnos ──────────────────────────────────────────────
const STUDENT_NAMES = [
  ['Lucas', 'González'], ['Valentina', 'Rodríguez'], ['Mateo', 'López'], ['Camila', 'Martínez'],
  ['Sebastián', 'Pérez'], ['Sofía', 'García'], ['Joaquín', 'Sánchez'], ['Martina', 'Romero'],
  ['Nicolás', 'Torres'], ['Isabella', 'Ruiz'], ['Tomás', 'Díaz'], ['Lucía', 'Herrera'],
  ['Diego', 'Moreno'], ['Emma', 'Muñoz'], ['Agustín', 'Álvarez'], ['Florencia', 'Suárez'],
  ['Facundo', 'Gutiérrez'], ['Julieta', 'Flores'], ['Rodrigo', 'Reyes'], ['Antonella', 'Cruz'],
  ['Ezequiel', 'Vega'], ['Emilia', 'Ríos'], ['Santiago', 'Mendoza'], ['Catalina', 'Ortiz'],
  ['Alejandro', 'Ramos'], ['Renata', 'Castillo'], ['Ignacio', 'Morales'], ['Daniela', 'Jiménez'],
  ['Pablo', 'Vargas'], ['Valeria', 'Soto'], ['Andrés', 'Castro'], ['Natalia', 'Rojas'],
  ['Bruno', 'Fernández'], ['Paula', 'Aguirre'], ['Franco', 'Quispe'], ['Celeste', 'Medina'],
  ['Leandro', 'Acosta'], ['Milagros', 'Ibarra'], ['Julián', 'Espinoza'], ['Romina', 'Ponce'],
  ['Marcos', 'Cabrera'], ['Luciana', 'Salazar'], ['Hernán', 'Bravo'], ['Priscila', 'Delgado'],
  ['Cristian', 'Vera'], ['Noelia', 'Méndez'], ['Gastón', 'Núñez'], ['Verónica', 'Peralta'],
  ['Gustavo', 'Arce'], ['Lorena', 'Mena'],
];

// ── 7 Evaluaciones por Curso: 3 Tareas, 2 Parciales, 2 TPs ───────────────────
const ASSIGNMENT_TEMPLATES = [
  { key: 't1', unitIdx: 0, title: 'Tarea 1: Conceptos Fundamentales',       type: 'tarea',  maxPts: 10, daysAgoDue: 75 },
  { key: 'tp1', unitIdx: 1, title: 'Trabajo Práctico 1: Taller Aplicado',   type: 'tp',     maxPts: 10, daysAgoDue: 60 },
  { key: 'p1', unitIdx: 1, title: 'Examen Parcial 1: Evaluación Integradora I', type: 'examen', maxPts: 20, daysAgoDue: 50 },
  { key: 't2', unitIdx: 2, title: 'Tarea 2: Análisis de Casos de Estudio',  type: 'tarea',  maxPts: 10, daysAgoDue: 38 },
  { key: 't3', unitIdx: 2, title: 'Tarea 3: Ejercicios de Consolidación',   type: 'tarea',  maxPts: 10, daysAgoDue: 26 },
  { key: 'tp2', unitIdx: 3, title: 'Trabajo Práctico 2: Proyecto Final',    type: 'tp',     maxPts: 10, daysAgoDue: 16 },
  { key: 'p2', unitIdx: 3, title: 'Examen Parcial 2: Evaluación Integradora II', type: 'examen', maxPts: 20, daysAgoDue: 8 },
];

const TEACHER_FEEDBACKS_HIGH = [
  'Excelente resolución técnica y conceptual. Demostró completo dominio de los objetivos del curso.',
  'Trabajo impecable. Muy buen análisis de requerimientos, código limpio y presentación profesional.',
  'Excelente desempeño. Las conclusiones reflejan una sólida comprensión teórica y práctica.',
  'Sobresaliente. Respuestas completas, fundamentadas con bibliografía y entregadas puntualmente.',
];

const TEACHER_FEEDBACKS_MID = [
  'Buen trabajo en general. Se recomienda prestar mayor atención al desarrollo de las justificaciones.',
  'Aprobado satisfactoriamente. Cumple con los requisitos solicitados, con margen de mejora en la estructura.',
  'Correcto. Los conceptos centrales están asimilados, sugiero profundizar en los ejercicios prácticos.',
  'Buen esfuerzo. El trabajo está aprobado; revisar las correcciones en el informe adjunto.',
];

const TEACHER_FEEDBACKS_LOW = [
  'Entrega incompleta. Faltan resolver varios apartados clave de la consigna.',
  'Calificación al límite. Se evidencian dificultades conceptuales que requieren revisión urgente.',
  'Entrega fuera de plazo con errores significativos de fundamentación.',
  'No alcanza los estándares mínimos de la cátedra. Se recomienda coordinar tutoría de refuerzo.',
];

// ── Función Principal del Seeder ──────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    console.log('============================================================');
    console.log('🌱 INICIANDO SEEDER INTEGRAL DE CLASSPAD');
    console.log('============================================================\n');

    await client.query('BEGIN');

    // ── 1. LIMPIEZA RESPETANDO USUARIOS PROTEGIDOS ─────────────────────────
    console.log('1. Limpiando datos transaccionales y usuarios no protegidos...');
    const tablesToClean = [
      'submission_attachments',
      'submission_files',
      'submissions',
      'assignment_attachments',
      'assignment_students',
      'assignments',
      'materials',
      'files',
      'units',
      'rubric_criteria',
      'student_grades',
      'grades',
      'attendance_records',
      'attendance_holidays',
      'attendance_sessions',
      'qr_tokens',
      'course_calendar_classes',
      'school_calendars',
      'course_students',
      'course_teachers',
      'enrollments',
      'notifications',
      'comments',
      'message_comments',
      'message_attachments',
      'messages',
      'audit_logs',
      'password_reset_codes',
      'user_notification_preferences',
      'courses',
    ];

    for (const table of tablesToClean) {
      try {
        await client.query(`SAVEPOINT sp_clean_${table}`);
        await client.query(`DELETE FROM ${table}`);
        await client.query(`RELEASE SAVEPOINT sp_clean_${table}`);
      } catch (cleanErr) {
        await client.query(`ROLLBACK TO SAVEPOINT sp_clean_${table}`);
      }
    }

    // Borrar usuarios excepto los 3 correos protegidos
    const placeholders = PROTECTED_EMAILS.map((_, i) => `$${i + 1}`).join(', ');
    await client.query(
      `DELETE FROM users WHERE LOWER(email) NOT IN (${placeholders})`,
      PROTECTED_EMAILS.map(e => e.toLowerCase())
    );

    // Obtener los IDs de los usuarios protegidos
    const protectedTeacherRes = await client.query(
      `SELECT id, display_name FROM users WHERE LOWER(email) = 'cesarr@classpad.com'`
    );
    const protectedTeacherId = protectedTeacherRes.rows[0]?.id || null;
    const protectedTeacherName = protectedTeacherRes.rows[0]?.display_name || 'Prof. César Rodríguez';

    const protectedStudentRes = await client.query(
      `SELECT id, display_name FROM users WHERE LOWER(email) = 'alumno.usab01@usab.test'`
    );
    const protectedStudentId = protectedStudentRes.rows[0]?.id || null;
    const protectedStudentName = protectedStudentRes.rows[0]?.display_name || 'Esteban Ramírez';

    console.log('   ✓ Tablas transaccionales limpiadas.');
    console.log(`   ✓ Profesor Titular Protegido: ${protectedTeacherName} (${protectedTeacherId})`);
    console.log(`   ✓ Alumno Destacado Protegido: ${protectedStudentName} (${protectedStudentId})\n`);

    // ── 2. CREACIÓN DE 5 PROFESORES ADICIONALES ──────────────────────────────
    console.log('2. Creando 5 profesores adicionales...');
    const defaultPasswordHash = await bcrypt.hash('Classpad2026!', 10);
    const teacherIds = [];

    for (const t of TEACHER_DATA) {
      const res = await client.query(
        `INSERT INTO users (
           id, email, display_name, role, password_hash, provider,
           cedula, is_active, must_change_password
         )
         VALUES ($1, $2, $3, 'teacher', $4, 'local', $5, true, false)
         ON CONFLICT (email) DO UPDATE
           SET display_name = EXCLUDED.display_name,
               role = 'teacher',
               password_hash = EXCLUDED.password_hash,
               cedula = EXCLUDED.cedula,
               is_active = true
         RETURNING id`,
        [randomUUID(), t.email, t.name, defaultPasswordHash, t.cedula]
      );
      teacherIds.push(res.rows[0].id);
    }
    console.log(`   ✓ ${teacherIds.length} profesores creados con éxito.\n`);

    // ── 3. CREACIÓN DE 18 CURSOS ─────────────────────────────────────────────
    console.log('3. Creando 18 cursos con calendario escolar oficial...');
    const createdCourses = [];

    for (let i = 0; i < COURSE_TEMPLATES.length; i++) {
      const tpl = COURSE_TEMPLATES[i];
      let ownerId;
      if (tpl.isCesar && protectedTeacherId) {
        ownerId = protectedTeacherId;
      } else {
        ownerId = teacherIds[tpl.teacherIdx ?? 0];
      }

      const courseId = randomUUID();
      const courseCode = tpl.code;

      await client.query(
        `INSERT INTO courses (
           id, name, description, turn, grade, semester, year, color,
           owner_id, course_code, is_active,
           classroom_pavilion, classroom_floor, classroom_number, class_days
         )
         VALUES ($1, $2, $3, $4, $5, '1er Semestre', 2026, $6, $7, $8, true, $9, $10, $11, $12)`,
        [
          courseId,
          tpl.name,
          `Curso regular de ${tpl.name} correspondiente al periodo académico 2026. Cátedra universitaria.`,
          tpl.turn,
          tpl.grade,
          tpl.color,
          ownerId,
          courseCode,
          tpl.pavilion,
          tpl.floor,
          tpl.num,
          tpl.days,
        ]
      );

      // Asignar en course_teachers como owner
      await client.query(
        `INSERT INTO course_teachers (id, course_id, teacher_id, role, permissions)
         VALUES ($1, $2, $3, 'owner', '["manage_students", "create_assignments", "grade_submissions"]')
         ON CONFLICT (course_id, teacher_id) DO NOTHING`,
        [randomUUID(), courseId, ownerId]
      );

      // Calendario escolar del curso (school_calendars): 09 de Febrero a 26 de Junio de 2026
      await client.query(
        `INSERT INTO school_calendars (id, course_id, start_date, end_date, notes)
         VALUES ($1, $2, '2026-02-09', '2026-06-26', 'Calendario Oficial 1er Semestre 2026')
         ON CONFLICT (course_id) DO NOTHING`,
        [randomUUID(), courseId]
      );

      createdCourses.push({
        id: courseId,
        ownerId,
        name: tpl.name,
        code: courseCode,
        isCesar: !!tpl.isCesar,
        unitsTpl: tpl.units,
        classTopics: tpl.classTopics,
      });
    }

    // Co-titularidad para César en Matemáticas I y Algoritmos
    if (protectedTeacherId) {
      const coCourses = createdCourses.filter(c => c.code === 'MAT101' || c.code === 'INF101');
      for (const c of coCourses) {
        await client.query(
          `INSERT INTO course_teachers (id, course_id, teacher_id, role, permissions)
           VALUES ($1, $2, $3, 'teacher', '["manage_students", "create_assignments", "grade_submissions"]')
           ON CONFLICT (course_id, teacher_id) DO NOTHING`,
          [randomUUID(), c.id, protectedTeacherId]
        );
      }
    }
    console.log(`   ✓ ${createdCourses.length} cursos y calendarios escolares configurados.\n`);

    // ── 4. CREACIÓN DE UNIDADES Y MATERIALES ─────────────────────────────────
    console.log('4. Creando 4 unidades y materiales de cátedra por curso...');
    const courseUnitsMap = {}; // courseId -> [unitId1, unitId2, unitId3, unitId4]
    let totalMaterials = 0;

    for (const course of createdCourses) {
      courseUnitsMap[course.id] = [];

      for (let uIdx = 0; uIdx < course.unitsTpl.length; uIdx++) {
        const u = course.unitsTpl[uIdx];
        const unitId = randomUUID();

        await client.query(
          `INSERT INTO units (id, course_id, title, description, order_index, is_published)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [unitId, course.id, u.title, u.desc, uIdx + 1]
        );
        courseUnitsMap[course.id].push(unitId);

        // Agregar 2 materiales didácticos por unidad
        const materialsData = [
          {
            title: `Diapositivas y Apuntes — ${u.title}`,
            desc: `Material de lectura y presentaciones oficiales del docente.`,
            type: 'pdf',
            mime: 'application/pdf',
            fileName: `diapositivas_unidad_${uIdx + 1}.pdf`,
            url: `/uploads/materials/${course.code.toLowerCase()}_u${uIdx + 1}_slides.pdf`,
          },
          {
            title: `Guía de Ejercicios y Casos Prácticos — ${u.title}`,
            desc: `Ejercitarios prácticos para laboratorio y estudio autónomo.`,
            type: 'document',
            mime: 'application/pdf',
            fileName: `guia_practica_u${uIdx + 1}.pdf`,
            url: `/uploads/materials/${course.code.toLowerCase()}_u${uIdx + 1}_guia.pdf`,
          }
        ];

        for (let mIdx = 0; mIdx < materialsData.length; mIdx++) {
          const m = materialsData[mIdx];
          await client.query(
            `INSERT INTO materials (
               id, unit_id, title, description, type, url, file_size,
               file_name, mime_type, order_index, uploaded_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              randomUUID(),
              unitId,
              m.title,
              m.desc,
              m.type,
              m.url,
              rnd(150000, 850000), // ~150KB - 850KB
              m.fileName,
              m.mime,
              mIdx + 1,
              course.ownerId,
            ]
          );
          totalMaterials++;
        }
      }
    }
    console.log(`   ✓ 72 unidades publicadas con ${totalMaterials} materiales didácticos adjuntos.\n`);

    // ── 5. CREACIÓN DE 50 ALUMNOS ────────────────────────────────────────────
    console.log('5. Creando 50 alumnos...');
    const allStudentIds = [];

    for (let i = 0; i < STUDENT_NAMES.length; i++) {
      const [fn, ln] = STUDENT_NAMES[i];
      const numStr = String(i + 1).padStart(2, '0');
      const email = `alumno${numStr}@usab.edu`;
      const cedula = `400000${String(i + 1).padStart(3, '0')}`;

      const res = await client.query(
        `INSERT INTO users (
           id, email, display_name, role, password_hash, provider,
           cedula, is_active, must_change_password
         )
         VALUES ($1, $2, $3, 'student', $4, 'local', $5, true, false)
         ON CONFLICT (email) DO UPDATE
           SET display_name = EXCLUDED.display_name,
               role = 'student',
               password_hash = EXCLUDED.password_hash,
               cedula = EXCLUDED.cedula,
               is_active = true
         RETURNING id`,
        [randomUUID(), email, `${fn} ${ln}`, defaultPasswordHash, cedula]
      );
      allStudentIds.push(res.rows[0].id);
    }

    // Agregar también al alumno protegido
    if (protectedStudentId && !allStudentIds.includes(protectedStudentId)) {
      allStudentIds.push(protectedStudentId);
    }
    console.log(`   ✓ ${allStudentIds.length} alumnos registrados en el sistema.\n`);

    // ── 6. MATRÍCULAS Y DISTRIBUCIÓN EN CURSOS ───────────────────────────────
    console.log('6. Matriculando alumnos en los cursos (course_students y enrollments)...');
    const courseStudentsMap = {};
    createdCourses.forEach(c => { courseStudentsMap[c.id] = []; });

    // Matricular a los 50 alumnos generales (4 a 6 cursos)
    const generalStudents = allStudentIds.filter(id => id !== protectedStudentId);
    for (const studentId of generalStudents) {
      const shuffled = [...createdCourses].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, rnd(4, 6));

      for (const course of selected) {
        const enrollmentDate = daysAgo(rnd(80, 95));

        await client.query(
          `INSERT INTO course_students (id, course_id, student_id, enrolled_at, status)
           VALUES ($1, $2, $3, $4, 'active')
           ON CONFLICT (course_id, student_id) DO NOTHING`,
          [randomUUID(), course.id, studentId, enrollmentDate]
        );

        await client.query(
          `INSERT INTO enrollments (id, course_id, student_id, enrolled_at, status)
           VALUES ($1, $2, $3, $4, 'active')
           ON CONFLICT DO NOTHING`,
          [randomUUID(), course.id, studentId, enrollmentDate]
        );

        courseStudentsMap[course.id].push(studentId);
      }
    }

    // Matricular obligatoriamente a Esteban Ramírez (alumno.usab01@usab.test)
    // En los 3 cursos de César + 3 cursos de otros docentes
    if (protectedStudentId) {
      const cesarCourses = createdCourses.filter(c => c.isCesar);
      const otherCourses = createdCourses.filter(c => !c.isCesar).slice(0, 3);
      const studentCoursesToEnroll = [...cesarCourses, ...otherCourses];

      for (const course of studentCoursesToEnroll) {
        const enrollmentDate = daysAgo(85);
        await client.query(
          `INSERT INTO course_students (id, course_id, student_id, enrolled_at, status)
           VALUES ($1, $2, $3, $4, 'active')
           ON CONFLICT (course_id, student_id) DO NOTHING`,
          [randomUUID(), course.id, protectedStudentId, enrollmentDate]
        );
        await client.query(
          `INSERT INTO enrollments (id, course_id, student_id, enrolled_at, status)
           VALUES ($1, $2, $3, $4, 'active')
           ON CONFLICT DO NOTHING`,
          [randomUUID(), course.id, protectedStudentId, enrollmentDate]
        );
        if (!courseStudentsMap[course.id].includes(protectedStudentId)) {
          courseStudentsMap[course.id].push(protectedStudentId);
        }
      }
    }

    // Asegurar un mínimo de 15 alumnos por cada curso
    for (const course of createdCourses) {
      if (courseStudentsMap[course.id].length < 15) {
        const missing = allStudentIds.filter(id => !courseStudentsMap[course.id].includes(id));
        const toAdd = Math.min(15 - courseStudentsMap[course.id].length, missing.length);
        for (let k = 0; k < toAdd; k++) {
          const sId = missing[k];
          const enrollmentDate = daysAgo(80);
          await client.query(
            `INSERT INTO course_students (id, course_id, student_id, enrolled_at, status)
             VALUES ($1, $2, $3, $4, 'active')
             ON CONFLICT (course_id, student_id) DO NOTHING`,
            [randomUUID(), course.id, sId, enrollmentDate]
          );
          await client.query(
            `INSERT INTO enrollments (id, course_id, student_id, enrolled_at, status)
             VALUES ($1, $2, $3, $4, 'active')
             ON CONFLICT DO NOTHING`,
            [randomUUID(), course.id, sId, enrollmentDate]
          );
          courseStudentsMap[course.id].push(sId);
        }
      }
    }
    console.log('   ✓ Distribución de matrículas completada con éxito.\n');

    // ── 7. CLASES PROGRAMADAS EN EL CALENDARIO Y ASISTENCIAS ─────────────────
    console.log('7. Programando clases en el calendario (course_calendar_classes) y generando sesiones...');
    let totalScheduled = 0;
    let totalSessions = 0;
    let totalAttendanceRecords = 0;

    for (const course of createdCourses) {
      const students = courseStudentsMap[course.id];
      const units = courseUnitsMap[course.id];
      const sessionCount = course.classTopics.length; // 12 clases

      // Asignar perfiles académicos a los estudiantes de este curso para DIVERSIDAD ESTADÍSTICA
      // Perfil 1: Sobresaliente (30%) -> 90-100% asistencia, notas 8.5-10 y 17-20
      // Perfil 2: Regular (45%)       -> 75-85% asistencia, notas 6.5-8.5 y 13-16.5
      // Perfil 3: En Riesgo / Límite (15%) -> 60-70% asistencia, notas 5.0-6.5 y 10-12.5
      // Perfil 4: Crítico / No Habilitado (10%) -> 40-52% asistencia, notas 2.5-4.8 y 6-9
      const studentProfiles = new Map();
      students.forEach((sId, index) => {
        if (sId === protectedStudentId) {
          studentProfiles.set(sId, 'EXCELLENT');
        } else {
          const ratio = index / students.length;
          if (ratio < 0.30) studentProfiles.set(sId, 'EXCELLENT');
          else if (ratio < 0.75) studentProfiles.set(sId, 'REGULAR');
          else if (ratio < 0.90) studentProfiles.set(sId, 'WARNING');
          else studentProfiles.set(sId, 'CRITICAL');
        }
      });

      for (let s = 0; s < sessionCount; s++) {
        const weeksAgo = sessionCount - s;
        const sessionDate = daysAgo(weeksAgo * 7 + (s % 2 === 0 ? 0 : 2));
        const dateStr = formatDateYMD(sessionDate);
        const startTime = new Date(sessionDate.setHours(rnd(8, 18), 0, 0, 0));
        const endTime = new Date(startTime.getTime() + 90 * 60 * 1000);

        const topicTitle = course.classTopics[s];
        const assignedUnitId = units[Math.floor(s / 3)] || units[0];

        // A. Registrar en course_calendar_classes (Calendario Académico del Curso)
        await client.query(
          `INSERT INTO course_calendar_classes (
             id, course_id, unit_id, unit_ids, class_date, title, description, updated_at
           )
           VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, NOW())
           ON CONFLICT (course_id, class_date) DO UPDATE
             SET title = EXCLUDED.title, description = EXCLUDED.description, unit_id = EXCLUDED.unit_id`,
          [
            randomUUID(),
            course.id,
            assignedUnitId,
            JSON.stringify([assignedUnitId]),
            dateStr,
            `Clase ${s + 1}: ${topicTitle}`,
            `Contenido dictado conforme al programa de estudios de la unidad.`,
          ]
        );
        totalScheduled++;

        // B. Crear attendance_session correspondiente
        const sessRes = await client.query(
          `INSERT INTO attendance_sessions (
             course_id, title, description, qr_token, is_active,
             start_time, end_time, created_by
           )
           VALUES ($1, $2, $3, $4, false, $5, $6, $7)
           RETURNING id`,
          [
            course.id,
            `Clase ${s + 1}: ${topicTitle}`,
            `Sesión presencial de cátedra.`,
            randomUUID(),
            startTime,
            endTime,
            course.ownerId,
          ]
        );
        const sessionId = sessRes.rows[0].id;
        totalSessions++;

        // C. Registrar asistencias con comportamiento realista según perfil
        for (const studentId of students) {
          const profile = studentProfiles.get(studentId) || 'REGULAR';
          let status;

          if (profile === 'EXCELLENT') {
            status = Math.random() < 0.92 ? 'present' : 'late';
          } else if (profile === 'REGULAR') {
            const r = Math.random();
            if (r < 0.78) status = 'present';
            else if (r < 0.88) status = 'late';
            else if (r < 0.94) status = 'excused';
            else status = 'absent';
          } else if (profile === 'WARNING') {
            const r = Math.random();
            if (r < 0.58) status = 'present';
            else if (r < 0.68) status = 'late';
            else if (r < 0.76) status = 'excused';
            else status = 'absent';
          } else { // CRITICAL (< 60% habilitación)
            const r = Math.random();
            if (r < 0.42) status = 'present';
            else if (r < 0.48) status = 'late';
            else status = 'absent';
          }

          const recordedAt = new Date(startTime.getTime() + rnd(5, 45) * 60 * 1000);

          await client.query(
            `INSERT INTO attendance_records (
               session_id, course_id, student_id, record_type, status,
               recorded_at, recorded_by
             )
             VALUES ($1, $2, $3, 'manual', $4, $5, $6)
             ON CONFLICT (session_id, student_id) DO NOTHING`,
            [sessionId, course.id, studentId, status, recordedAt, course.ownerId]
          );
          totalAttendanceRecords++;
        }
      }
    }
    console.log(`   ✓ ${totalScheduled} clases programadas en calendarios.`);
    console.log(`   ✓ ${totalSessions} sesiones de asistencia y ${totalAttendanceRecords} registros individuales generados.\n`);

    // ── 8. ACTIVIDADES Y ENTREGAS (SUBMISSIONS) ──────────────────────────────
    console.log('8. Creando 3 tareas, 2 exámenes y 2 TPs por curso con entregas y notas según perfiles...');
    let totalAssignments = 0;
    let totalSubmissions = 0;
    const gradeBookData = {}; // courseId -> studentId -> { p1, p2, tp1, tp2 }

    for (const course of createdCourses) {
      const students = courseStudentsMap[course.id];
      const units = courseUnitsMap[course.id];
      gradeBookData[course.id] = {};

      for (const tpl of ASSIGNMENT_TEMPLATES) {
        const assignId = randomUUID();
        const dueDate = daysAgo(tpl.daysAgoDue);
        const assignedUnitId = units[tpl.unitIdx] || units[0];

        await client.query(
          `INSERT INTO assignments (
             id, course_id, unit_id, title, description, instructions,
             due_date, max_points, is_published, status, created_by
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 'published', $9)`,
          [
            assignId,
            course.id,
            assignedUnitId,
            tpl.title,
            `Actividad evaluativa de ${tpl.type.toUpperCase()}: ${tpl.title} — ${course.name}.`,
            'Subir documento en formato PDF o resolver las consignas prácticas en la plataforma.',
            dueDate,
            tpl.maxPts,
            course.ownerId,
          ]
        );
        totalAssignments++;

        // Asignar submissions según perfil del alumno
        for (let idx = 0; idx < students.length; idx++) {
          const studentId = students[idx];
          if (!gradeBookData[course.id][studentId]) {
            gradeBookData[course.id][studentId] = { p1: 0, p2: 0, tp1: 0, tp2: 0 };
          }

          const isProtectedStudent = (studentId === protectedStudentId);
          const ratio = idx / students.length;

          let shouldSubmit = true;
          let rawGrade;
          let feedback;

          if (isProtectedStudent) {
            rawGrade = tpl.maxPts === 10 ? rnd(9, 10) : rnd(18, 20);
            feedback = course.isCesar
              ? 'Excelente trabajo Esteban. Se evidencia rigurosidad técnica, orden y aplicación precisa de los conceptos.'
              : 'Sobresaliente desempeño Esteban, entrega clara y muy bien fundamentada.';
          } else if (ratio < 0.30) {
            // EXCELLENT
            rawGrade = tpl.maxPts === 10 ? rnd(8, 10) : rnd(17, 20);
            feedback = pick(TEACHER_FEEDBACKS_HIGH);
          } else if (ratio < 0.75) {
            // REGULAR
            rawGrade = tpl.maxPts === 10 ? rnd(6, 8) : rnd(13, 16);
            feedback = pick(TEACHER_FEEDBACKS_MID);
          } else if (ratio < 0.90) {
            // WARNING (omite alguna tarea)
            if (tpl.key === 't3' && Math.random() < 0.4) shouldSubmit = false;
            rawGrade = tpl.maxPts === 10 ? rnd(5, 7) : rnd(10, 13);
            feedback = pick(TEACHER_FEEDBACKS_LOW);
          } else {
            // CRITICAL (no entrega algunas actividades)
            if ((tpl.key === 't2' || tpl.key === 'tp2') && Math.random() < 0.6) shouldSubmit = false;
            rawGrade = tpl.maxPts === 10 ? rnd(3, 5) : rnd(6, 9);
            feedback = pick(TEACHER_FEEDBACKS_LOW);
          }

          if (shouldSubmit) {
            const submittedAt = new Date(dueDate.getTime() - rnd(1, 4) * 24 * 60 * 60 * 1000);
            const gradedAt = new Date(submittedAt.getTime() + rnd(1, 2) * 24 * 60 * 60 * 1000);

            await client.query(
              `INSERT INTO submissions (
                 id, assignment_id, student_id, content, grade,
                 feedback, status, submitted_at, graded_at, graded_by
               )
               VALUES ($1, $2, $3, $4, $5, $6, 'graded', $7, $8, $9)
               ON CONFLICT (assignment_id, student_id) DO NOTHING`,
              [
                randomUUID(),
                assignId,
                studentId,
                `Informe de resolución para la actividad ${tpl.title}. Documento de desarrollo entregado.`,
                rawGrade,
                feedback,
                submittedAt,
                gradedAt,
                course.ownerId,
              ]
            );
            totalSubmissions++;

            // Acumular para student_grades
            if (tpl.key === 'p1') gradeBookData[course.id][studentId].p1 = rawGrade;
            if (tpl.key === 'p2') gradeBookData[course.id][studentId].p2 = rawGrade;
            if (tpl.key === 'tp1') gradeBookData[course.id][studentId].tp1 = rawGrade;
            if (tpl.key === 'tp2') gradeBookData[course.id][studentId].tp2 = rawGrade;
          }
        }
      }
    }
    console.log(`   ✓ ${totalAssignments} actividades evaluativas creadas.`);
    console.log(`   ✓ ${totalSubmissions} entregas corregidas y calificadas con retroalimentación.\n`);

    // ── 9. ACTAS DE CALIFICACIONES (STUDENT_GRADES) ──────────────────────────
    console.log('9. Generando actas de calificaciones con cálculo automático de promedios...');
    let totalGradeRows = 0;

    for (const course of createdCourses) {
      for (const [studentId, grades] of Object.entries(gradeBookData[course.id])) {
        const isProtectedStudent = (studentId === protectedStudentId);
        let p1 = Math.round(grades.p1);
        let p2 = Math.round(grades.p2);
        let tp = Math.round(grades.tp1 + grades.tp2);

        if (isProtectedStudent) {
          p1 = p1 || 19;
          p2 = p2 || 19;
          tp = tp || 19;
        }

        // Proceso evaluativo: P1(20) + P2(20) + TP(20) = 60 puntos máx
        const totalProceso = p1 + p2 + tp;

        // Generar examen final (40 puntos máx) solo para alumnos habilitados (total >= 36, es decir 60%)
        let examenFinal = null;
        if (totalProceso >= 36) {
          if (isProtectedStudent) {
            examenFinal = rnd(38, 40);
          } else if (totalProceso >= 50) {
            examenFinal = rnd(32, 40);
          } else if (totalProceso >= 42) {
            examenFinal = rnd(26, 34);
          } else {
            examenFinal = rnd(22, 28);
          }
        }

        // El trigger calculate_grade_average calcula:
        // total = p1 + p2 + tp (máx 60)
        // promedio = total + (examen_final || 0) (Puntaje Final, máx 100)
        // habilitado_final = (total >= 36)
        // habilitado_recuperacion = (total >= 24 && total < 36)
        await client.query(
          `INSERT INTO student_grades (
             course_id, student_id, parcial_1, parcial_2, trabajos_practicos, examen_final, is_published
           )
           VALUES ($1, $2, $3, $4, $5, $6, true)
           ON CONFLICT (course_id, student_id) DO UPDATE
             SET parcial_1 = EXCLUDED.parcial_1,
                 parcial_2 = EXCLUDED.parcial_2,
                 trabajos_practicos = EXCLUDED.trabajos_practicos,
                 examen_final = EXCLUDED.examen_final,
                 is_published = true`,
          [course.id, studentId, p1, p2, tp, examenFinal]
        );
        totalGradeRows++;
      }
    }
    console.log(`   ✓ ${totalGradeRows} actas de notas calculadas y publicadas en el sistema.\n`);

    await client.query('COMMIT');

    console.log('============================================================');
    console.log('🎉 SEEDER INTEGRAL FINALIZADO CON ÉXITO');
    console.log('============================================================');
    console.log(`  Cursos en el Sistema      : ${createdCourses.length}`);
    console.log(`  Clases Programadas        : ${totalScheduled}`);
    console.log(`  Sesiones de Asistencia    : ${totalSessions}`);
    console.log(`  Registros de Asistencia   : ${totalAttendanceRecords}`);
    console.log(`  Unidades de Aprendizaje   : ${createdCourses.length * 4}`);
    console.log(`  Materiales de Cátedra     : ${totalMaterials}`);
    console.log(`  Actividades Evaluativas   : ${totalAssignments}`);
    console.log(`  Entregas Corregidas       : ${totalSubmissions}`);
    console.log(`  Actas de Calificaciones   : ${totalGradeRows}`);
    console.log('------------------------------------------------------------');
    console.log('  Estadísticas y diversidad generadas:');
    console.log('   - Grupos de asistencia: Excelencia (95%+), Regular (80%), Alerta (65%), Crítico (<50%)');
    console.log('   - Rendimiento: Alumnos habilitados para final, para recuperación y en riesgo');
    console.log('   - Profesor César Rodríguez: 3 cursos titulares con 55 alumnos activos y métricas ricas');
    console.log('   - Alumno Esteban Ramírez: 6 cursos con asistencia perfecta (100%) y promedio sobresaliente (19+)');
    console.log('============================================================\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error fatal durante la ejecución del seeder:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
