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

// Configuración CORS robusta
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://plataforma-cumplimiento-mvp-qj4w.vercel.app',
    'https://plataforma-cumplimiento-mvp.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin']
};

// Middleware
app.use(cors(corsOptions));
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
    node_env: process.env.NODE_ENV
  });
});

// Rutas de redirección para compatibilidad
app.get('/cliente/registrar-cliente', (req, res) => {
  res.redirect('/registrar-cliente');
});

// Manejador de errores global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error global:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
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