// backend/src/routes/cliente.routes.ts
import { Router } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const router = Router();
const saltRounds = 10;

// Inyecta el pool desde main.ts
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
        tipo_entidad, // 'persona_fisica' o 'persona_moral'
        nombre_cliente,
        tipo_cliente, // 'persona_fisica' o 'persona_moral'
        actividad_economica
      } = req.body;

      // Validaciones básicas
      if (!email || !password || !nombre_empresa || !nombre_cliente) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      await client.query('BEGIN');

      // 1. Crear empresa (si no existe, pero para MVP: siempre crea una nueva)
      const empresaResult = await client.query(
        `INSERT INTO empresas (nombre_legal, rfc, tipo_entidad)
         VALUES ($1, $2, $3) RETURNING id`,
        [nombre_empresa, rfc || null, tipo_entidad || 'persona_moral']
      );
      const empresaId = empresaResult.rows[0].id;

      // 2. Hashear contraseña
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 3. Crear usuario con rol 'cliente'
      const usuarioResult = await client.query(
        `INSERT INTO usuarios (email, password_hash, nombre_completo, rol, empresa_id)
         VALUES ($1, $2, $3, 'cliente', $4) RETURNING id`,
        [email, passwordHash, nombre_completo, empresaId]
      );
      const usuarioId = usuarioResult.rows[0].id;

      // 4. Crear cliente
      const clienteResult = await client.query(
        `INSERT INTO clientes (empresa_id, nombre_entidad, tipo_cliente, actividad_economica, porcentaje_cumplimiento)
         VALUES ($1, $2, $3, $4, 0) RETURNING id`,
        [empresaId, nombre_cliente, tipo_cliente || 'persona_fisica', actividad_economica || 'otro']
      );
      const clienteId = clienteResult.rows[0].id;

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        usuarioId,
        empresaId,
        clienteId,
        message: 'Cliente registrado exitosamente'
      });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error al registrar cliente:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      client.release();
    }
  });

  return router;
};