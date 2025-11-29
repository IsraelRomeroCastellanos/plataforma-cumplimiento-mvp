// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import { JWT_SECRET } from '../services/auth.service';

const router = Router();

const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();
  const ddmmyyyy = cleanStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    const isoDate = `${year}-${month}-${day}`;
    const date = new Date(isoDate);
    if (!isNaN(date.getTime()) && date.getFullYear() == parseInt(year)) {
      return isoDate;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const date = new Date(cleanStr);
    if (!isNaN(date.getTime())) {
      return cleanStr;
    }
  }
  return null;
};

export const clienteRoutes = (pool: Pool) => {
  // ✅ Registro unitario CORREGIDO
  router.post('/api/cliente/registrar', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as any;
    } catch (err: any) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (!payload || !['admin', 'consultor', 'cliente'].includes(payload.role)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const {
      nombre_entidad,
      tipo_cliente,
      actividad_economica,
      alias,
      fecha_nacimiento_constitucion,
      nacionalidad,
      domicilio_mexico,
      ocupacion
    } = req.body;

    if (!nombre_entidad || !tipo_cliente || !actividad_economica) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: nombre_entidad, tipo_cliente, actividad_economica' });
    }

    if (!['persona_fisica', 'persona_moral'].includes(tipo_cliente)) {
      return res.status(400).json({ error: 'Tipo de cliente no válido' });
    }

    let empresaId;
    if (payload.role === 'cliente') {
      if (!payload.empresaId) {
        return res.status(400).json({ error: 'El usuario cliente debe tener una empresa asignada' });
      }
      empresaId = payload.empresaId;
    } else {
      if (!req.body.empresa_id) {
        return res.status(400).json({ error: 'Se requiere empresa_id para admin/consultor' });
      }
      empresaId = req.body.empresa_id;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const empCheck = await client.query('SELECT id FROM empresas WHERE id = $1 AND estado = $2', [empresaId, 'activo']);
      if (empCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'La empresa especificada no existe o está inactiva' });
      }

      const duplicateCheck = await client.query(
        'SELECT id FROM clientes WHERE empresa_id = $1 AND nombre_entidad = $2',
        [empresaId, nombre_entidad]
      );
      if (duplicateCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Ya existe un cliente con ese nombre en esta empresa' });
      }

      const result = await client.query(
        `INSERT INTO clientes 
         (empresa_id, nombre_entidad, alias, fecha_nacimiento_constitucion, nacionalidad, domicilio_mexico, ocupacion, tipo_cliente, actividad_economica, porcentaje_cumplimiento, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 'activo')
         RETURNING id`,
        [
          empresaId,
          nombre_entidad,
          alias || null,
          parseDate(fecha_nacimiento_constitucion) || null,
          nacionalidad || null,
          domicilio_mexico || null,
          ocupacion || null,
          tipo_cliente,
          actividad_economica
        ]
      );

      await client.query('COMMIT');
      res.status(201).json({ success: true, clienteId: result.rows[0].id });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Error al registrar cliente unitario:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      client.release();
    }
  });

  // ✅ RESTO DEL CÓDIGO (carga masiva, plantilla Excel, etc.)
  // ... [código de carga masiva y otros endpoints igual al anterior] ...
};