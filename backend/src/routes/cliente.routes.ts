// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

export const clienteRoutes = (pool: Pool) => {
  // ✅ Carga masiva SIN express-fileupload (solo texto plano)
  router.post('/api/carga-directa', async (req: Request, res: Response) => {
    console.log('=== CARGA MASIVA SIN FILEUPLOAD ===');
    
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: 'Contenido CSV no proporcionado' });
    }

    try {
      const lines = csvContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');

      if (lines.length < 2) {
        return res.status(400).json({ 
          error: `El archivo tiene ${lines.length} líneas (se necesitan al menos 2)` 
        });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        let successCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const [nombre, tipo, actividad] = lines[i].split(',').map(s => s.trim());
          if (nombre && tipo && actividad && ['persona_fisica', 'persona_moral'].includes(tipo)) {
            await client.query(
              `INSERT INTO clientes (empresa_id, nombre_entidad, tipo_cliente, actividad_economica, estado)
               VALUES (1, $1, $2, $3, 'activo')`,
              [nombre, tipo, actividad]
            );
            successCount++;
          }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: `✅ ${successCount} cliente(s) cargado(s)` });
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