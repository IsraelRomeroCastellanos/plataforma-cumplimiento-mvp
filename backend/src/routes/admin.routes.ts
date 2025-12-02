// backend/src/routes/admin.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

export const adminRoutes = (pool: Pool) => {
  // ✅ Listar usuarios
  router.get('/api/admin/usuarios', async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, email, nombre_completo, rol, empresa_id, activo FROM usuarios ORDER BY creado_en DESC'
      );
      res.json({ usuarios: result.rows });
    } catch (err: any) {
      console.error('Error al listar usuarios:', err);
      res.status(500).json({ error: 'Error al cargar usuarios' });
    }
  });

  // ✅ Editar empresa
  router.put('/api/admin/empresas/:id', async (req: Request, res: Response) => {
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

      await pool.query(
        'UPDATE empresas SET nombre_legal = $1, rfc = $2, tipo_entidad = $3, estado = $4, actualizado_en = NOW() WHERE id = $5',
        [nombre_legal, rfc || null, tipo_entidad, estado || 'activo', id]
      );

      res.json({ success: true, message: 'Empresa actualizada' });
    } catch (err: any) {
      console.error('Error al editar empresa:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // ✅ Listar empresas
  router.get('/api/admin/empresas', async (req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT id, nombre_legal, rfc, tipo_entidad, estado FROM empresas ORDER BY nombre_legal');
      res.json({ empresas: result.rows });
    } catch (err: any) {
      console.error('Error al listar empresas:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // ✅ Editar/Desactivar usuario
  router.put('/api/admin/usuarios/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, nombre_completo, rol, empresa_id, activo } = req.body;

    try {
      const userCheck = await pool.query('SELECT id, email FROM usuarios WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const usuarioActual = userCheck.rows[0];
      
      if (usuarioActual.email === 'admin@cumplimiento.com') {
        if (rol !== undefined && rol !== 'admin') {
          return res.status(403).json({ error: 'El rol del usuario raíz no puede modificarse' });
        }
        if (email !== undefined && email !== 'admin@cumplimiento.com') {
          return res.status(403).json({ error: 'El email del usuario raíz no puede modificarse' });
        }
        if (activo !== undefined && !activo) {
          return res.status(403).json({ error: 'El usuario raíz no puede desactivarse' });
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

      values.push(
        ...[email, nombre_completo, rol, empresa_id, activo].filter(v => v !== undefined),
        id
      );

      const query = `
        UPDATE usuarios 
        SET ${fields.join(', ')}, actualizado_en = NOW() 
        WHERE id = $${paramIndex}
      `;

      await pool.query(query, values);
      res.json({ success: true, message: 'Usuario actualizado' });

    } catch (err: any) {
      console.error('Error al actualizar usuario:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  return router;
};