// backend/src/routes/admin.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

export const adminRoutes = (pool: Pool) => {
  // ✅ Editar empresa (CORREGIDO)
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

  // ✅ Resto de endpoints (usuarios, etc.)
  router.put('/api/admin/usuarios/:id', async (req: Request, res: Response) => {
    // ... código de desactivación de usuarios ...
  });

  router.get('/api/admin/usuarios', async (req: Request, res: Response) => {
    // ... código de listado de usuarios ...
  });

  return router;
};