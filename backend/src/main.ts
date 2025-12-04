// backend/src/main.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import fileUpload from 'express-fileupload';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_muy_seguro';

// Configuración CORS definitiva
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://plataforma-cumplimiento-mvp-qj4w.vercel.app',
    'https://plataforma-cumplimiento-mvp.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Base de datos - configuración segura
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
});

// Endpoint de login DEFINITIVO
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    
    // Buscar usuario
    const result = await pool.query(
      'SELECT id, email, password_hash, nombre_completo, rol, empresa_id, activo FROM usuarios WHERE email = $1',
      [sanitizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        empresaId: user.empresa_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Responder con token y datos del usuario
    res.status(200).json({
      token,
      user: {
        id: user.id,
        nombre_completo: user.nombre_completo,
        email: user.email,
        rol: user.rol,
        empresa_id: user.empresa_id,
        activo: user.activo
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Ruta de salud (siempre funcional)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: "OK",
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV
  });
});

// Manejador de errores global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error global:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(port, () => {
  console.log(`✅ Backend corriendo en puerto ${port}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

export default app;