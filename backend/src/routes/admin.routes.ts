import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

export const adminRoutes = (pool: Pool) => {
  router.get('/api/admin/usuarios', async (req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT id, email, nombre_completo, rol, empresa_id, activo FROM usuarios');
      res.json({ usuarios: result.rows });
    } catch (err: any) {
      console.error('Error al listar usuarios:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  router.get('/api/admin/empresas', async (req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT id, nombre_legal, rfc, tipo_entidad, estado FROM empresas');
      res.json({ empresas: result.rows });
    } catch (err: any) {
      console.error('Error al listar empresas:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  return router;
};