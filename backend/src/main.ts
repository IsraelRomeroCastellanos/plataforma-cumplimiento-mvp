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

// Configuración CORS robusta para todos los entornos
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://plataforma-cumplimiento-mvp-qj4w.vercel.app',
    'https://plataforma-cumplimiento-mvp.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
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
    rejectUnauthorized: false,
    ca: process.env.DB_SSL_CA
  } : false,
});

// Rutas
app.use('/api/login', authRoutes(pool));
app.use('/api/cliente', clienteRoutes(pool));
app.use('/api/admin', adminRoutes(pool));

// Rutas de diagnóstico
app.get('/api/health', (req, res) => {
  res.json({ 
    status: "OK",
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
    database_connected: !!pool
  });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      status: "OK", 
      database: "connected",
      current_time: result.rows[0].current_time
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Manejador de errores global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`✅ Backend corriendo en puerto ${port}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Base de datos: ${process.env.DATABASE_URL ? 'Configurada' : 'No configurada'}`);
});

export default app;