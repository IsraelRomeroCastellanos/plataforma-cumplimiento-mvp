// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

export const clienteRoutes = (pool: Pool) => {
  router.post('/api/carga-directa', async (req: Request, res: Response) => {
    console.log('=== DEPURACIÓN ===');
    console.log('Files:', req.files ? 'EXISTE' : 'NO EXISTE');
    
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'Archivo no encontrado en req.files' });
    }

    // ✅ Manejo seguro de UploadedFile | UploadedFile[]
    const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
    
    console.log('Archivo:', file.name, 'Tamaño:', file.size);
    
    if (file.size === 0) {
      return res.status(400).json({ error: 'Archivo vacío (0 bytes)' });
    }
    
    try {
      const content = file.data.toString('utf8');
      console.log('Contenido:', content.substring(0, 100));
      
      if (!content.trim()) {
        return res.status(400).json({ error: 'Contenido vacío después de trim' });
      }
      
      res.json({ success: true, message: 'Archivo recibido y procesado' });
    } catch (err) {
      console.error('Error al leer:', err);
      res.status(500).json({ error: 'Error al procesar el archivo' });
    }
  });

  return router; // ✅ ¡Esta línea es crucial!
};