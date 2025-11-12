// backend/src/routes/admin.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();
const saltRounds = 10;

export const adminRoutes = (pool: Pool) => {
  // Listar usuarios
  router.get('/api/admin/usuarios', authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, email, nombre_completo, rol, empresa_id, creado_en, activo FROM usuarios ORDER BY creado_en DESC'
      );
      res.json({ usuarios: result.rows });
    } catch (err) {
      console.error('Error al listar usuarios:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Listar empresas
  router.get('/api/admin/empresas', authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT id, nombre_legal, rfc, tipo_entidad, estado FROM empresas ORDER BY nombre_legal');
      res.json({ empresas: result.rows });
    } catch (err) {
      console.error('Error al listar empresas:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Crear empresa
  router.post('/api/admin/empresas', authorizeRoles('admin'), async (req: Request, res: Response) => {
    const { nombre_legal, rfc, tipo_entidad } = req.body;
    if (!nombre_legal || !tipo_entidad) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    if (!['persona_fisica', 'persona_moral'].includes(tipo_entidad)) {
      return res.status(400).json({ error: 'Tipo de entidad no válido' });
    }
    try {
      const result = await pool.query(
        'INSERT INTO empresas (nombre_legal, rfc, tipo_entidad, estado) VALUES ($1, $2, $3, $4) RETURNING *',
        [nombre_legal, rfc || null, tipo_entidad, 'activo']
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una empresa con ese nombre o RFC' });
      }
      console.error('Error al crear empresa:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Editar empresa
  router.put('/api/admin/empresas/:id', authorizeRoles('admin'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre_legal, rfc, tipo_entidad, estado } = req.body;
    if (!nombre_legal || !tipo_entidad) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    if (!['persona_fisica', 'persona_moral'].includes(tipo_entidad)) {
      return res.status(400).json({ error: 'Tipo de entidad no válido' });
    }
    if (estado && !['activo', 'suspendido', 'inactivo'].includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }
    try {
      const check = await pool.query('SELECT id FROM empresas WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
      }

      const result = await pool.query(
        'UPDATE empresas SET nombre_legal = $1, rfc = $2, tipo_entidad = $3, estado = $4, actualizado_en = NOW() WHERE id = $5 RETURNING *',
        [nombre_legal, rfc || null, tipo_entidad, estado || 'activo', id]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una empresa con ese nombre o RFC' });
      }
      console.error('Error al editar empresa:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Crear usuario
  router.post('/api/admin/usuarios', authorizeRoles('admin'), async (req: Request, res: Response) => {
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
  router.put('/api/admin/usuarios/:id', authorizeRoles('admin'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, nombre_completo, rol, empresa_id, activo } = req.body;

    try {
      const userCheck = await pool.query('SELECT id, email FROM usuarios WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const usuarioActual = userCheck.rows[0];
      
      // 🔒 PROTECCIÓN DEL USUARIO RAÍZ
      if (usuarioActual.email === 'admin@cumplimiento.com') {
        if (rol !== undefined && rol !== 'admin') {
          return res.status(403).json({ error: 'El rol del usuario raíz no puede modificarse' });
        }
        if (email !== undefined && email !== 'admin@cumplimiento.com') {
          return res.status(403).json({ error: 'El email del usuario raíz no puede modificarse' });
        }
      }

      if (nombre_completo !== undefined) {
        if (typeof nombre_completo !== 'string' || nombre_completo.trim() === '') {
          return res.status(400).json({ error: 'El nombre completo no puede estar vacío' });
        }
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

  // Restablecer contraseña de usuario
  router.post('/api/admin/usuarios/:id/reset-password', authorizeRoles('admin'), async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // 🔒 PROTECCIÓN DEL USUARIO RAÍZ
    const rootCheck = await pool.query(
      'SELECT email FROM usuarios WHERE id = $1 AND email = $2',
      [id, 'admin@cumplimiento.com']
    );
    if (rootCheck.rows.length > 0) {
      return res.status(403).json({ error: 'No se puede restablecer la contraseña del usuario raíz' });
    }

    try {
      const temporalPassword = 'Temp' + Math.random().toString(36).slice(2, 8) + '!';
      const passwordHash = await bcrypt.hash(temporalPassword, saltRounds);

      const result = await pool.query(
        'UPDATE usuarios SET password_hash = $1 WHERE id = $2 RETURNING email',
        [passwordHash, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ 
        success: true, 
        email: result.rows[0].email,
        temporalPassword
      });
    } catch (err) {
      console.error('Error al restablecer contraseña:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  return router;
};