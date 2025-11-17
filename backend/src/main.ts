// backend/src/main.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { authRoutes } from './routes/auth.routes';
import { clienteRoutes } from './routes/cliente.routes';
import { adminRoutes } from './routes/admin.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// ✅ CORS con soporte para pruebas locales y producción
app.use(cors({
  origin: [
    'http://localhost:3000',    // Frontend en desarrollo
    'http://localhost:8080',    // Pruebas HTML locales
    'https://plataforma-cumplimiento-mvp-qj4w.vercel.app' // Producción
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(authRoutes(pool));
app.use(clienteRoutes(pool));
app.use(adminRoutes(pool));

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(port, () => {
  console.log(`✅ Backend corriendo en puerto ${port}`);
});