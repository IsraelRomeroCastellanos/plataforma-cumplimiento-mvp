// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

export const clienteRoutes = (pool: Pool) => {
  router.post('/api/carga-directa', async (req: Request, res: Response) => {
    console.log('=== INICIO DE CARGA MASIVA ===');
    
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
    console.log('Archivo:', file.name, 'Tamaño:', file.size);

    if (file.size === 0) {
      return res.status(400).json({ error: 'Archivo vacío' });
    }

    try {
      let content = file.data.toString('utf8');
      console.log('Contenido bruto:', JSON.stringify(content.substring(0, 100)));

      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      if (content.startsWith('ï»¿')) {
        content = content.substring(3);
      }

      const lines = content.split('\n').map(line => line.trim()).filter(line => line !== '');
      console.log('Líneas:', lines);

      if (lines.length < 2) {
        return res.status(400).json({ error: 'El archivo debe tener encabezado y al menos una fila de datos' });
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