// backend/src/main.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { clienteRoutes } from './routes/cliente.routes';
import { authRoutes } from './routes/auth.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://plataforma-cumplimiento-mvp-qj4w.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Rutas públicas
app.use(authRoutes(pool));
app.use(clienteRoutes(pool));

// Rutas de diagnóstico
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