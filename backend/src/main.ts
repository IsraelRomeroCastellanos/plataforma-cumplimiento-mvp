// backend/src/main.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import fileUpload from 'express-fileupload';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://plataforma-cumplimiento-mvp-qj4w.vercel.app'],
  credentials: true
}));

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }
}));

app.use(express.json({ limit: '50mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(require('./routes/auth.routes')(pool));
app.use(require('./routes/cliente.routes')(pool));
app.use(require('./routes/admin.routes')(pool));

// Formulario de prueba
app.get('/carga-masiva-directa', (req, res) => {
  res.send(`
    <form action="/api/carga-directa" method="post" enctype="multipart/form-data">
      <input type="file" name="file" accept=".csv" required>
      <button type="submit">Subir CSV</button>
    </form>
  `);
});

app.listen(port, () => {
  console.log(`✅ Backend corriendo en puerto ${port}`);
});