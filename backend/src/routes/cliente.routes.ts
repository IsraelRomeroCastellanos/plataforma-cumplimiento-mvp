// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import { JWT_SECRET } from '../services/auth.service';

const router = Router();

// ✅ Función para parsear fechas en formato DD/MM/YYYY
const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();
  
  // Intentar formato DD/MM/YYYY o DD-MM-YYYY
  const ddmmyyyy = cleanStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    const isoDate = `${year}-${month}-${day}`;
    
    // Validar que la fecha sea real
    const date = new Date(isoDate);
    if (!isNaN(date.getTime()) && date.getFullYear() == parseInt(year)) {
      return isoDate;
    }
  }
  
  // Intentar formato ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const date = new Date(cleanStr);
    if (!isNaN(date.getTime())) {
      return cleanStr;
    }
  }
  
  return null;
};

export const clienteRoutes = (pool: Pool) => {
  // ✅ Plantilla Excel con validaciones
  router.get('/api/cliente/plantilla-excel', async (req, res) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clientes');

      worksheet.columns = [
        { header: 'Nombre del Cliente *', key: 'nombre_entidad', width: 30 },
        { header: 'Tipo de Cliente *', key: 'tipo_cliente', width: 20 },
        { header: 'Actividad Económica *', key: 'actividad_economica', width: 30 },
        { header: 'Estado del Bien', key: 'estado_bien', width: 15 },
        { header: 'Alias', key: 'alias', width: 20 },
        { header: 'Fecha Nacimiento/Constitución', key: 'fecha_nacimiento', width: 25 },
        { header: 'Nacionalidad', key: 'nacionalidad', width: 20 },
        { header: 'Domicilio en México', key: 'domicilio_mexico', width: 30 },
        { header: 'Ocupación', key: 'ocupacion', width: 25 }
      ];

      for (let row = 2; row <= 1000; row++) {
        worksheet.getCell(`B${row}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"persona_fisica,persona_moral"']
        };
        worksheet.getCell(`D${row}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Nuevo,Usado,Viejo"']
        };
      }

      worksheet.getRow(1).font = { bold: true };

      const buf = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=plantilla_clientes.xlsx');
      res.send(buf);
    } catch (err) {
      console.error('Error Excel:', err);
      res.status(500).json({ error: 'Error al generar Excel' });
    }
  });

  // ✅ Carga masiva con manejo robusto de fechas
  router.post('/api/carga-directa', async (req: Request, res: Response) => {
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: 'Contenido CSV no proporcionado' });
    }

    try {
      let lines = csvContent
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line !== '' && !line.startsWith('#'));

      if (lines.length > 0 && (lines[0].includes('Nombre del Cliente *') || lines[0].includes('nombre_entidad'))) {
        lines = lines.slice(1);
      }

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

      let successCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const client = await pool.connect();
        try {
          const values = lines[i].split(',').map((s: string) => {
            const trimmed = s.trim();
            return trimmed.startsWith('"') && trimmed.endsWith('"')
              ? trimmed.slice(1, -1)
              : trimmed;
          });

          if (values.length < 3) continue;

          const nombre_entidad = values[0];
          const tipo_cliente = values[1];
          const actividad_economica = values[2];
          const estado_bien = values[3] || null;
          const alias = values[4] || null;
          const fecha_nacimiento_constitucion = parseDate(values[5]) || null;
          const nacionalidad = values[6] || null;
          const domicilio_mexico = values[7] || null;
          const ocupacion = values[8] || null;

          if (nombre_entidad && tipo_cliente && actividad_economica && ['persona_fisica', 'persona_moral'].includes(tipo_cliente)) {
            await client.query('BEGIN');
            await client.query(
              `INSERT INTO clientes (empresa_id, nombre_entidad, tipo_cliente, actividad_economica, estado, alias, fecha_nacimiento_constitucion, nacionalidad, domicilio_mexico, ocupacion)
               VALUES ($1, $2, $3, $4, 'activo', $5, $6, $7, $8, $9)`,
              [
                empresaId,
                nombre_entidad,
                tipo_cliente,
                actividad_economica,
                alias,
                fecha_nacimiento_constitucion,
                nacionalidad,
                domicilio_mexico,
                ocupacion
              ]
            );
            await client.query('COMMIT');
            successCount++;
          }
        } catch (err) {
          console.error('Error en cliente', i, ':', err.message || err);
          await client.query('ROLLBACK');
        } finally {
          client.release();
        }
      }

      res.json({ success: true, message: `✅ ${successCount} cliente(s) cargado(s)` });
    } catch (err) {
      console.error('Error en carga masiva:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // ✅ Listar clientes para todos los roles
  router.get('/api/cliente/mis-clientes', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    try {
      let clientes;
      if (payload.role === 'cliente' && payload.empresaId) {
        const result = await pool.query(
          'SELECT id, nombre_entidad, tipo_cliente, actividad_economica, estado FROM clientes WHERE empresa_id = $1 ORDER BY nombre_entidad',
          [payload.empresaId]
        );
        clientes = result.rows;
      } else {
        const result = await pool.query(
          `SELECT c.id, c.nombre_entidad, c.tipo_cliente, c.actividad_economica, c.estado, e.nombre_legal as empresa 
           FROM clientes c 
           JOIN empresas e ON c.empresa_id = e.id 
           ORDER BY e.nombre_legal, c.nombre_entidad`
        );
        clientes = result.rows;
      }
      res.json({ clientes });
    } catch (err) {
      console.error('Error al listar clientes:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // ✅ Actualizar estado de cliente
  router.put('/api/cliente/:id/estado', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!estado || !['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    try {
      let empresaId;
      if (payload.role === 'cliente') {
        empresaId = payload.empresaId;
      } else {
        const check = await pool.query('SELECT empresa_id FROM clientes WHERE id = $1', [id]);
        if (check.rows.length === 0) {
          return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        empresaId = check.rows[0].empresa_id;
      }

      await pool.query(
        'UPDATE clientes SET estado = $1, actualizado_en = NOW() WHERE id = $2',
        [estado, id]
      );
      res.json({ success: true, message: 'Estado actualizado' });
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // ✅ ¡DEVUELVE EL ROUTER!
  return router;
};