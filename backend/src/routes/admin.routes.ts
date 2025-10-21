// backend/src/routes/admin.routes.ts
import { Router } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();
const saltRounds = 10;

export const adminRoutes = (pool: Pool) => {
  // Listar usuarios
  router.get('/api/admin/usuarios', authorizeRoles('admin'), async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, email, rol, empresa_id, creado_en, activo FROM usuarios ORDER BY creado_en DESC'
      );
      res.json({ usuarios: result.rows });
    } catch (err) {
      console.error('Error al listar usuarios:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Listar empresas (para el formulario de creación de usuarios)
  router.get('/api/admin/empresas', authorizeRoles('admin'), async (req, res) => {
    try {
      const result = await pool.query('SELECT id, nombre_legal FROM empresas ORDER BY nombre_legal');
      res.json({ empresas: result.rows });
    } catch (err) {
      console.error('Error al listar empresas:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Crear usuario
  router.post('/api/admin/usuarios', authorizeRoles('admin'), async (req, res) => {
    const { email, password, nombre_completo, rol, empresa_id } = req.body;

    if (!email || !password || !nombre_completo || !rol) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (!['admin', 'consultor', 'cliente'].includes(rol)) {
      return res.status(400).json({ error: 'Rol no válido' });
    }

    if (rol === 'cliente' && !empresa_id) {
      return res.status(400).json({ error: 'Los clientes deben estar vinculados a una empresa' });
    }

    if ((rol === 'admin' || rol === 'consultor') && empresa_id) {
      return res.status(400).json({ error: 'Los administradores y consultores no pueden tener empresa asignada' });
    }

    try {
      if (empresa_id) {
        const empResult = await pool.query('SELECT id FROM empresas WHERE id = $1', [empresa_id]);
        if (empResult.rows.length === 0) {
          return res.status(400).json({ error: 'La empresa especificada no existe' });
        }
      }

      const passwordHash = await bcrypt.hash(password, saltRounds);

      const result = await pool.query(
        'INSERT INTO usuarios (email, password_hash, nombre_completo, rol, empresa_id, activo) VALUES ($1, $2, $3, $4, $5, true) RETURNING id',
        [email, passwordHash, nombre_completo, rol, empresa_id || null]
      );

      res.status(201).json({ success: true, usuarioId: result.rows[0].id });
    } catch (err: any) {
      if (err.code === '23505' && err.constraint === 'usuarios_email_key') {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }
      console.error('Error al crear usuario:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Editar/Desactivar usuario
  router.put('/api/admin/usuarios/:id', authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    const { email, nombre_completo, rol, empresa_id, activo } = req.body;

    try {
      const userCheck = await pool.query('SELECT id FROM usuarios WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (rol && !['admin', 'consultor', 'cliente'].includes(rol)) {
        return res.status(400).json({ error: 'Rol no válido' });
      }

      if (rol === 'cliente' && !empresa_id) {
        return res.status(400).json({ error: 'Los clientes deben estar vinculados a una empresa' });
      }

      if ((rol === 'admin' || rol === 'consultor') && empresa_id) {
        return res.status(400).json({ error: 'Los administradores y consultores no pueden tener empresa asignada' });
      }

      if (empresa_id) {
        const empResult = await pool.query('SELECT id FROM empresas WHERE id = $1', [empresa_id]);
        if (empResult.rows.length === 0) {
          return res.status(400).json({ error: 'La empresa especificada no existe' });
        }
      }

      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (email !== undefined) fields.push(`email = $${paramIndex++}`);
      if (nombre_completo !== undefined) fields.push(`nombre_completo = $${paramIndex++}`);
      if (rol !== undefined) fields.push(`rol = $${paramIndex++}`);
      if (empresa_id !== undefined) fields.push(`empresa_id = $${paramIndex++}`);
      if (activo !== undefined) fields.push(`activo = $${paramIndex++}`);

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
      }

      values.push(...[
        email,
        nombre_completo,
        rol,
        empresa_id || null,
        activo
      ].filter(v => v !== undefined), id);

      const query = `
        UPDATE usuarios 
        SET ${fields.join(', ')}, actualizado_en = NOW() 
        WHERE id = $${paramIndex}
      `;

      await pool.query(query, values);
      res.json({ success: true, message: 'Usuario actualizado' });

    } catch (err: any) {
      if (err.code === '23505' && err.constraint === 'usuarios_email_key') {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }
      console.error('Error al actualizar usuario:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  return router;
};