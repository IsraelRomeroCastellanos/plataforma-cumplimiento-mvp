// backend/src/routes/cliente.routes.ts
import { Router } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const router = Router();
const saltRounds = 10;

export const clienteRoutes = (pool: Pool) => {
  router.post('/api/cliente', async (req, res) => {
    const client = await pool.connect();
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

      await client.query('BEGIN');

      // 1. Crear empresa
      const empresaResult = await client.query(
        'INSERT INTO empresas (nombre_legal, rfc, tipo_entidad) VALUES ($1, $2, $3) RETURNING id',
        [nombre_empresa, rfc || null, tipo_entidad]
      );
      const empresaId = empresaResult.rows[0].id;

      // 2. Hashear contraseña
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 3. Crear usuario
      await client.query(
        'INSERT INTO usuarios (email, password_hash, nombre_completo, rol, empresa_id) VALUES ($1, $2, $3, $4, $5)',
        [email, passwordHash, nombre_completo, 'cliente', empresaId]
      );

      // 4. Crear cliente
      await client.query(
        'INSERT INTO clientes (empresa_id, nombre_entidad, tipo_cliente, actividad_economica) VALUES ($1, $2, $3, $4)',
        [empresaId, nombre_cliente, tipo_cliente, actividad_economica]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Cliente registrado exitosamente'
      });

    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Error al registrar cliente:', err);

      // Manejo específico para email duplicado
      if (err.code === '23505' && err.constraint === 'usuarios_email_key') {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }

      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      client.release();
    }
  });

  return router;
};