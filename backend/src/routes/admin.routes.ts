// backend/src/routes/admin.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();
const saltRounds = 10;

export const adminRoutes = (pool: Pool) => {
  // ✅ Editar/Desactivar usuario CORREGIDO
  router.put('/api/admin/usuarios/:id', authorizeRoles('admin'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, nombre_completo, rol, empresa_id, activo } = req.body;

    try {
      const userCheck = await pool.query('SELECT id, email FROM usuarios WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const usuarioActual = userCheck.rows[0];
      
      // ✅ PROTECCIÓN DEL USUARIO RAÍZ
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

      if (email !== undefined) {
        if (typeof email !== 'string' || email.trim() === '') {
          return res.status(400).json({ error: 'El email no puede estar vacío' });
        }
        fields.push(`email = $${paramIndex++}`);
      }

      if (nombre_completo !== undefined) {
        if (typeof nombre_completo !== 'string' || nombre_completo.trim() === '') {
          return res.status(400).json({ error: 'El nombre completo no puede estar vacío' });
        }
        fields.push(`nombre_completo = $${paramIndex++}`);
      }

      if (rol !== undefined) {
        if (!['admin', 'consultor', 'cliente'].includes(rol)) {
          return res.status(400).json({ error: 'Rol no válido' });
        }
        fields.push(`rol = $${paramIndex++}`);
      }

      if (empresa_id !== undefined) {
        fields.push(`empresa_id = $${paramIndex++}`);
      }

      if (activo !== undefined) {
        if (typeof activo !== 'boolean') {
          return res.status(400).json({ error: 'El campo activo debe ser booleano' });
        }
        fields.push(`activo = $${paramIndex++}`);
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
      }

      // ✅ Validación de empresa para rol cliente
      if (rol === 'cliente' && empresa_id === undefined) {
        const currentEmp = await pool.query('SELECT empresa_id FROM usuarios WHERE id = $1', [id]);
        if (!currentEmp.rows[0].empresa_id) {
          return res.status(400).json({ error: 'Los clientes deben tener una empresa asignada' });
        }
      }

      if (rol === 'cliente' && empresa_id) {
        const empResult = await pool.query('SELECT id FROM empresas WHERE id = $1 AND estado = $2', [empresa_id, 'activo']);
        if (empResult.rows.length === 0) {
          return res.status(400).json({ error: 'La empresa especificada no existe o está inactiva' });
        }
      }

      if ((rol === 'admin' || rol === 'consultor') && empresa_id) {
        return res.status(400).json({ error: 'Los administradores y consultores no pueden tener empresa asignada' });
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
      console.error('Error al actualizar usuario:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // ... resto del código de administración ...
};