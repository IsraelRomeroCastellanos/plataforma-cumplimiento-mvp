// backend/src/main.ts
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
const port = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:3000', 'https://plataforma-cumplimiento-mvp-qj4w.vercel.app'],
  credentials: true
}));

// ✅ fileUpload antes de express.json()
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(authRoutes(pool));
app.use(clienteRoutes(pool));
app.use(adminRoutes(pool));

// ✅ Formulario de carga masiva directo en Render
app.get('/carga-masiva', (req, res) => {
  res.send(`
    <html>
      <head><title>Carga Masiva - Backend</title></head>
      <body>
        <h2>Carga Masiva de Clientes</h2>
        <form action="/api/carga-directa" method="post" enctype="multipart/form-data">
          <input type="file" name="file" accept=".csv" required>
          <button type="submit">Subir CSV</button>
        </form>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`✅ Backend corriendo en puerto ${port}`);
});