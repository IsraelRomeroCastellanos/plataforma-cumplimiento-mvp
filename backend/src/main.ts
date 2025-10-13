import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:3000', 'https://plataforma-cumplimiento-mvp-qj4w.vercel.app']
}));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Endpoint de prueba simple
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando' });
});

// Endpoint de cliente (versión simplificada)
app.post('/api/cliente', async (req, res) => {
  try {
    const { email, password, nombre_empresa, nombre_cliente } = req.body;
    
    if (!email || !password || !nombre_empresa || !nombre_cliente) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // 1. Crear empresa
    const empresa = await pool.query(
      'INSERT INTO empresas (nombre_legal) VALUES ($1) RETURNING id',
      [nombre_empresa]
    );

    // 2. Hashear contraseña
    const hash = await bcrypt.hash(password, 10);

    // 3. Crear usuario
    await pool.query(
      'INSERT INTO usuarios (email, password_hash, nombre_completo, rol, empresa_id) VALUES ($1, $2, $3, $4, $5)',
      [email, hash, 'Usuario ' + nombre_cliente, 'cliente', empresa.rows[0].id]
    );

    // 4. Crear cliente
    await pool.query(
      'INSERT INTO clientes (empresa_id, nombre_entidad, tipo_cliente) VALUES ($1, $2, $3)',
      [empresa.rows[0].id, nombre_cliente, 'persona_fisica']
    );

    res.status(201).json({ success: true, message: 'Cliente creado' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Al final, antes de app.listen
app.get('/api/debug-routes', (req, res) => {
  res.json({ message: 'Backend activo. Endpoint /api/cliente debe existir.' });
});
app.listen(port, () => {
  console.log(`✅ Backend corriendo en puerto ${port}`);
});