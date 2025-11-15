// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { verifyToken } from '../services/auth.service';

const router = Router();
const saltRounds = 10;

export const clienteRoutes = (pool: Pool) => {
  // ... resto del código igual hasta el endpoint de carga masiva ...

  // Carga masiva de clientes
  router.post('/api/cliente/carga-masiva', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload || !['admin', 'consultor', 'cliente'].includes(payload.role)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'Archivo no proporcionado' });
    }

    const file = req.files.file as any;
    const content = file.data.toString('utf8');
    // ✅ Procesamiento seguro de líneas vacías
    const lines = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line !== '');

    // ✅ Validación mejorada
    if (lines.length === 0) {
      return res.status(400).json({ error: 'El archivo está vacío' });
    }
    if (lines.length === 1) {
      return res.status(400).json({ error: 'El archivo debe tener al menos una fila de datos' });
    }

    const headers = lines[0].split(',').map((h: string) => h.trim());
    const requiredHeaders = ['nombre_entidad', 'tipo_cliente', 'actividad_economica'];
    const missing = requiredHeaders.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Faltan columnas requeridas: ${missing.join(', ')}` });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let successCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < headers.length) continue;

        const row: Record<string, string> = {};
        headers.forEach((header: string, j: number) => {
          row[header] = values[j] ? values[j].trim() : '';
        });

        if (!['persona_fisica', 'persona_moral'].includes(row.tipo_cliente)) {
          continue;
        }

        let empresaId;
        if (payload.role === 'cliente') {
          empresaId = (payload as any).empresaId;
        } else {
          if (row.empresa_id) {
            empresaId = parseInt(row.empresa_id);
          } else {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Se requiere empresa_id en el CSV para admin/consultor' });
          }
        }

        if (!empresaId) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'El usuario no tiene empresa asignada' });
        }

        const duplicateCheck = await client.query(
          'SELECT id FROM clientes WHERE empresa_id = $1 AND nombre_entidad = $2',
          [empresaId, row.nombre_entidad]
        );
        if (duplicateCheck.rows.length > 0) {
          continue;
        }

        await client.query(
          `INSERT INTO clientes (empresa_id, nombre_entidad, alias, fecha_nacimiento_constitucion, nacionalidad, domicilio_mexico, ocupacion, tipo_cliente, actividad_economica, porcentaje_cumplimiento, estado)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'activo')`,
          [
            empresaId,
            row.nombre_entidad,
            row.alias || null,
            row.fecha_nacimiento_constitucion || null,
            row.nacionalidad || null,
            row.domicilio_mexico || null,
            row.ocupacion || null,
            row.tipo_cliente,
            row.actividad_economica,
            0
          ]
        );
        successCount++;
      }

      await client.query('COMMIT');
      res.json({ successCount });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en carga masiva:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      client.release();
    }
  });

  // ... resto del código igual ...
};