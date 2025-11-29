import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import fileUpload from 'express-fileupload';
import { authRoutes } from './routes/auth.routes';
import { clienteRoutes } from './routes/cliente.routes';
import { adminRoutes } from './routes/admin.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://plataforma-cumplimiento-mvp-qj4w.vercel.app'],
  credentials: true
}));

app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ✅ Registro CORRECTO de todas las rutas
app.use(authRoutes(pool));
app.use(clienteRoutes(pool));
app.use(adminRoutes(pool));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});