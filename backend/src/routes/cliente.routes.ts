// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

export const clienteRoutes = (pool: Pool) => {
  // Endpoint de carga masiva directa
  router.post('/api/carga-directa', async (req: Request, res: Response) => {
    console.log('=== DEPURACIÓN DE CARGA MASIVA ===');
    
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    // Manejo seguro de UploadedFile | UploadedFile[]
    const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
    console.log('Archivo recibido:', file.name, 'Tamaño:', file.size, 'bytes');

    if (file.size === 0) {
      return res.status(400).json({ error: 'El archivo tiene 0 bytes' });
    }

    try {
      let content = file.data.toString('utf8');
      console.log('Contenido original (primeros 100 chars):', content.substring(0, 100));

      // ✅ Eliminar BOM UTF-8
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      // ✅ Eliminar BOM UTF-8 alternativo
      if (content.startsWith('ï»¿')) {
        content = content.substring(3);
      }

      // ✅ Procesar líneas
      const lines = content
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line !== '');

      console.log('Líneas procesadas:', lines.length);
      if (lines.length === 0) {
        return res.status(400).json({ error: 'El archivo no tiene contenido válido' });
      }
      if (lines.length === 1) {
        return res.status(400).json({ error: 'El archivo debe tener al menos una fila de datos' });
      }

      // ✅ Leer encabezados
      const headers = lines[0].split(',').map((h: string) => h.trim());
      console.log('Encabezados:', headers);

      // ✅ Validar columnas obligatorias
      const requiredHeaders = ['nombre_entidad', 'tipo_cliente', 'actividad_economica'];
      const missing = requiredHeaders.filter(h => !headers.includes(h));
      if (missing.length > 0) {
        return res.status(400).json({ 
          error: `Faltan columnas requeridas: ${missing.join(', ')}` 
        });
      }

      // ✅ Procesar datos
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        let successCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length < 3) continue;

          const row: Record<string, string> = {};
          headers.forEach((header: string, j: number) => {
            row[header] = values[j] ? values[j].trim() : '';
          });

          // Validar campos obligatorios
          if (!row.nombre_entidad || !row.tipo_cliente || !row.actividad_economica) {
            continue;
          }

          // Validar tipo de cliente
          if (!['persona_fisica', 'persona_moral'].includes(row.tipo_cliente)) {
            continue;
          }

          // ✅ Insertar cliente (asignado a empresa_id = 1 para pruebas)
          await client.query(
            `INSERT INTO clientes (empresa_id, nombre_entidad, tipo_cliente, actividad_economica, estado)
             VALUES (1, $1, $2, $3, 'activo')`,
            [row.nombre_entidad, row.tipo_cliente, row.actividad_economica]
          );
          successCount++;
        }

        await client.query('COMMIT');
        console.log(`✅ Carga exitosa: ${successCount} clientes insertados`);
        res.json({ 
          success: true, 
          message: `✅ ${successCount} cliente(s) cargado(s) exitosamente` 
        });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('❌ Error al procesar el archivo:', err);
      res.status(500).json({ 
        error: 'Error interno del servidor al procesar el archivo' 
      });
    }
  });

  return router;
};