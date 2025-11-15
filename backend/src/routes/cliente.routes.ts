// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { verifyToken } from '../services/auth.service';

const router = Router();

export const clienteRoutes = (pool: Pool) => {
  // ✅ Endpoint directo para carga masiva (sin autenticación para pruebas)
  router.post('/api/carga-directa', async (req: Request, res: Response) => {
    try {
      if (!req.files?.file) {
        return res.status(400).json({ error: 'No se envió archivo' });
      }

      const file = req.files.file as any;
      const content = file.data.toString('utf8');
      const lines = content.split('\n').filter((line: string) => line.trim() !== '');

      if (lines.length < 2) {
        return res.status(400).json({ error: 'Archivo vacío o sin datos' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        let count = 0;

        for (let i = 1; i < lines.length; i++) {
          const [nombre, tipo, actividad] = lines[i].split(',').map((s: string) => s.trim());
          if (nombre && tipo && actividad) {
            await client.query(
              `INSERT INTO clientes (empresa_id, nombre_entidad, tipo_cliente, actividad_economica, estado)
               VALUES (1, $1, $2, $3, 'activo')`,
              [nombre, tipo, actividad]
            );
            count++;
          }
        }

        await client.query('COMMIT');
        res.json({ success: true, cargados: count });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Error al procesar el archivo' });
    }
  });

  return router;
};