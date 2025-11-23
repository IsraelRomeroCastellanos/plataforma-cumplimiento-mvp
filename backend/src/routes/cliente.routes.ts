// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../services/auth.service';

const router = Router();

export const clienteRoutes = (pool: Pool) => {
  // ✅ Carga masiva (solo procesa CSV, no genera plantillas)
  router.post('/api/carga-directa', async (req: Request, res: Response) => {
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: 'Contenido CSV no proporcionado' });
    }

    try {
      // Procesar líneas válidas (sin comentarios)
      const lines = csvContent
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line !== '' && !line.startsWith('#'));

      if (lines.length === 0) {
        return res.status(400).json({ error: 'El archivo no tiene datos válidos' });
      }

      const authHeader = req.headers.authorization;
      let empresaId = 1;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const payload = jwt.verify(token, JWT_SECRET) as any;
          empresaId = payload.empresaId || 1;
        } catch (err) {
          console.warn('Token inválido en carga masiva');
        }
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        let successCount = 0;

        for (let i = 0; i < lines.length; i++) {
          const values = lines[i].split(',').map((s: string) => s.trim());
          if (values.length < 3) continue;

          const [nombre, tipo, actividad] = values;
          if (nombre && tipo && actividad && ['persona_fisica', 'persona_moral'].includes(tipo)) {
            await client.query(
              `INSERT INTO clientes (empresa_id, nombre_entidad, tipo_cliente, actividad_economica, estado)
               VALUES ($1, $2, $3, $4, 'activo')`,
              [empresaId, nombre, tipo, actividad]
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
      console.error('Error en carga masiva:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // ... resto del código (mis-clientes, actualizar estado, etc.) ...
};