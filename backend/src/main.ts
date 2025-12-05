// backend/src/main.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import fileUpload from 'express-fileupload';
import authRoutes from './routes/auth.routes';
import { clienteRoutes } from './routes/cliente.routes';
import { adminRoutes } from './routes/admin.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// ✅ CONFIGURACIÓN CORS DEFINITIVA - acepta todos los orígenes necesarios
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Permitir solicitudes sin origin (como Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8080',
      'https://plataforma-cumplimiento-mvp-qj4w.vercel.app',
      'https://plataforma-cumplimiento-mvp.vercel.app',
      'https://plataforma-cumplimiento-mvp.onrender.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin']
};

// ✅ MIDDLEWARE CORS - debe ir ANTES de cualquier ruta
app.use(cors(corsOptions));

// ✅ MANEJO DE OPTIONS (preflight requests)
app.options('*', cors(corsOptions));

// ✅ OTRO MIDDLEWARE
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ CONFIGURACIÓN DE BASE DE DATOS
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
});

// ✅ RUTAS - orden crítico
app.use('/api/login', authRoutes(pool));
app.use('/api/cliente', clienteRoutes(pool));
app.use('/api/admin', adminRoutes(pool));

// ✅ RUTAS PÚBLICAS Y DE REDIRECCIÓN
app.get('/api/health', (req, res) => {
  res.json({ 
    status: "OK",
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV
  });
});

// ✅ MANEJADOR DE ERRORES GLOBAL - SIEMPRE RESPONDE JSON
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error global:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  // ✅ SIEMPRE RESPONDER JSON, INCLUSO EN ERRORES
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`✅ Backend corriendo en puerto ${port}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

export default app;