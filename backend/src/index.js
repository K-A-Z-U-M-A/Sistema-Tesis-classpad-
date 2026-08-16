import './config/env.js'; // ← esto asegura que JWT_SECRET ya está cargado
import { spawn } from 'child_process';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import os from 'os';
import pool from './config/database.js';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import studentRoutes from './routes/students.js';
import teacherRoutes from './routes/teachers.js';
import courseRoutes from './routes/courses.js';
import unitRoutes from './routes/units.js';
import assignmentRoutes from './routes/assignments.js';
import messageRoutes from './routes/messages.js';
import submissionRoutes from './routes/submissions.js';
import { router as notificationRoutes } from './routes/notifications.js';
import attendanceRoutes from './routes/attendance.js';
import gradeRoutes from './routes/grades.js';
import reportRoutes from './routes/reports.js';
import auditRoutes from './routes/audit.js';
import adminRoutes from './routes/admin.js';
import passwordRecoveryRoutes from './routes/passwordRecovery.js';
import ensureAttendanceTables from './ensure-attendance-tables.js';
import ensureProfileFields from './ensure-profile-fields.js';
import ensureClassroomTables from './ensure-classroom-tables.js';
import { handleMulterError } from './config/multer.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  // Permitir acceso dinámico desde cualquier origen en la red local
  origin: true,
  credentials: true, // Permitir cookies/headers si fuera necesario en futuro
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static public files (for OAuth callback helper)
app.use(express.static(path.join(process.cwd(), "public")));

// Serve uploads with proper headers
app.use("/uploads", (req, res, next) => {
  // Set headers for file downloads
  res.setHeader('Content-Disposition', 'attachment');
  res.setHeader('Cache-Control', 'no-cache');
  next();
}, express.static(path.join(process.cwd(), "public/uploads")));

// Initialize Passport
app.use(passport.initialize());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordRecoveryRoutes); // Rutas de recuperación de contraseña
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);

// Endpoint de configuración de red (IP local + ngrok si está activo)
app.get('/api/config', async (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const ipv4 = Object.values(networkInterfaces)
    .flat()
    .find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';

  // Intentar detectar ngrok automáticamente
  let ngrokUrl = null;
  try {
    const ngrokRes = await fetch('http://localhost:4040/api/tunnels', { signal: AbortSignal.timeout(800) });
    if (ngrokRes.ok) {
      const data = await ngrokRes.json();
      const tunnel = data.tunnels?.find(t => t.proto === 'https');
      if (tunnel) ngrokUrl = tunnel.public_url;
    }
  } catch (_) {
    // ngrok no está corriendo, no pasa nada
  }

  res.json({
    ipv4,
    port: PORT,
    ngrokUrl  // null si ngrok no está activo
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND'
    }
  });
});

// Register Multer error handler
app.use(handleMulterError);

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
});

// Lanza ngrok como proceso hijo y muestra la URL cuando esté lista
async function startNgrok() {
  // Si ya hay una instancia corriendo, mostrar la URL y salir
  try {
    const res = await fetch('http://localhost:4040/api/tunnels', { signal: AbortSignal.timeout(800) });
    if (res.ok) {
      const data = await res.json();
      const tunnel = data.tunnels?.find(t => t.proto === 'https');
      if (tunnel) {
        console.log(`🌍 ngrok ya activo: ${tunnel.public_url}`);
        return;
      }
    }
  } catch (_) { /* ngrok no está corriendo, lo lanzamos */ }

  console.log('🚀 Iniciando ngrok...');
  const ngrok = spawn('ngrok', ['http', 'https://localhost:5173'], {
    stdio: 'ignore',
    detached: false,
    shell: true
  });

  ngrok.on('error', (err) => {
    console.log(`⚠️  No se pudo iniciar ngrok: ${err.message}`);
    console.log('   Instalalo desde https://ngrok.com/download o con: winget install ngrok.ngrok');
  });

  // Esperar a que ngrok esté listo y mostrar la URL
  let attempts = 0;
  const poll = setInterval(async () => {
    attempts++;
    try {
      const res = await fetch('http://localhost:4040/api/tunnels', { signal: AbortSignal.timeout(800) });
      if (res.ok) {
        const data = await res.json();
        const tunnel = data.tunnels?.find(t => t.proto === 'https');
        if (tunnel) {
          console.log(`🌍 ngrok activo: ${tunnel.public_url}`);
          clearInterval(poll);
          return;
        }
      }
    } catch (_) { /* aún iniciando */ }
    if (attempts >= 15) {
      clearInterval(poll);
      console.log('⚠️  ngrok tardó demasiado en iniciar');
    }
  }, 1000);
}

// Graceful shutdown
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🚀 Backend listo en http://localhost:${PORT}`);

  // Asegurar que las tablas de asistencia existan
  await ensureAttendanceTables();

  // Asegurar que los campos de perfil existan
  await ensureProfileFields();

  // Asegurar que las columnas de aula y catálogo de classrooms existan
  await ensureClassroomTables();

  // Lanzar ngrok automáticamente
  setTimeout(() => startNgrok(), 1000);
});

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('HTTP server closed');

    try {
      await pool.end();
      console.log('Database connections closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
