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

// Endpoint de prueba
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

// Endpoint para registrar cliente
app.post('/api/cliente', async (req, res) => {
  try {
    const {
      email,
      password,
      nombre_completo,
      nombre_empresa,
      rfc,
      tipo_entidad = 'persona_moral',
      nombre_cliente,
      tipo_cliente = 'persona_fisica',
      actividad_economica = 'otro'
    } = req.body;

    if (!email || !password || !nombre_empresa || !nombre_cliente || !nombre_completo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // 1. Crear empresa
    const empresaResult = await pool.query(
      'INSERT INTO empresas (nombre_legal, rfc, tipo_entidad) VALUES ($1, $2, $3) RETURNING id',
      [nombre_empresa, rfc || null, tipo_entidad]
    );
    const empresaId = empresaResult.rows[0].id;

    // 2. Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Crear usuario
    await pool.query(
      'INSERT INTO usuarios (email, password_hash, nombre_completo, rol, empresa_id) VALUES ($1, $2, $3, $4, $5)',
      [email, passwordHash, nombre_completo, 'cliente', empresaId]
    );

    // 4. Crear cliente
    await pool.query(
      'INSERT INTO clientes (empresa_id, nombre_entidad, tipo_cliente, actividad_economica) VALUES ($1, $2, $3, $4)',
      [empresaId, nombre_cliente, tipo_cliente, actividad_economica]
    );

    res.status(201).json({ success: true, message: 'Cliente registrado exitosamente' });
  } catch (err) {
    console.error('Error al registrar cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend corriendo en puerto ${port}`);
});