// backend/src/main.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { clienteRoutes } from './routes/cliente.routes';
import { authRoutes } from './routes/auth.routes';
import { authenticate } from './middleware/auth.middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:3000', 'https://plataforma-cumplimiento-mvp-qj4w.vercel.app'],
  credentials: true
}));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Rutas públicas
app.use(authRoutes(pool));
app.use(clienteRoutes(pool));

// Ruta protegida de ejemplo
app.get('/api/profile', authenticate, (req, res) => {
  res.json({ message: 'Acceso autorizado', user: (req as any).user });
});

// Rutas de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ db: 'OK', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: (err as Error).message });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend corriendo en puerto ${port}`);
});