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

// Configuración CORS ROBUSTA para todos los entornos
const corsOptions = {
  origin: function (origin: any, callback: any) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8080',
      'https://plataforma-cumplimiento-mvp-qj4w.vercel.app',
      'https://plataforma-cumplimiento-mvp.vercel.app',
      'https://plataforma-cumplimiento-mvp.onrender.com'
    ];
    
    // Permitir solicitudes sin origin (como Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin']
};

// Middleware CORS antes de cualquier ruta
app.use(cors(corsOptions));

// Pre-flight requests
app.options('*', cors(corsOptions));

// Otro middleware
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
});

// Rutas - ¡CRÍTICO: Mantener este orden!
app.use('/api/login', authRoutes(pool));
app.use('/api/cliente', clienteRoutes(pool));
app.use('/api/admin', adminRoutes(pool));

// Rutas públicas
app.get('/api/health', (req, res) => {
  res.json({ 
    status: "OK",
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
    database_connected: !!pool
  });
});

// Rutas de redirección para compatibilidad
app.get('/cliente/registrar-cliente', (req, res) => {
  res.redirect('/registrar-cliente');
});

// Manejador de errores global - RESPONDER SIEMPRE JSON
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error global:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  // Siempre responder JSON, incluso en errores
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`✅ Backend corriendo en puerto ${port}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Base de datos: ${process.env.DATABASE_URL ? 'Configurada' : 'No configurada'}`);
});

export default app;