// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import * as ExcelJS from 'exceljs';
import { JWT_SECRET } from '../services/auth.service';

const router = Router();

export const clienteRoutes = (pool: Pool) => {
  // ✅ Descargar plantilla Excel (CORREGIDO: validaciones en columnas completas)
  router.get('/api/cliente/plantilla', async (req, res) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clientes');

      // Definir columnas
      worksheet.columns = [
        { header: 'Nombre del Cliente *', key: 'nombre_entidad', width: 30 },
        { header: 'Tipo de Cliente *', key: 'tipo_cliente', width: 20 },
        { header: 'Actividad Económica *', key: 'actividad_economica', width: 30 },
        { header: 'Estado del Bien', key: 'estado_bien', width: 15 },
        { header: 'Alias', key: 'alias', width: 20 }
      ];

      // ✅ Aplicar validaciones a toda la columna (hasta fila 1000)
      const tipoClienteCol = worksheet.getColumn('B'); // Columna B = tipo_cliente
      tipoClienteCol.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber > 1) { // Excluir encabezado
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"persona_fisica,persona_moral"'],
            showErrorMessage: true,
            errorTitle: 'Tipo inválido',
            error: 'Use: persona_fisica o persona_moral'
          };
        }
      });

      const estadoBienCol = worksheet.getColumn('D'); // Columna D = estado_bien
      estadoBienCol.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber > 1) { // Excluir encabezado
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"Nuevo,Usado,Viejo"'],
            showErrorMessage: true,
            errorTitle: 'Estado inválido',
            error: 'Seleccione: Nuevo, Usado o Viejo'
          };
        }
      });

      // Formato de encabezado
      worksheet.getRow(1).font = { bold: true };

      // Generar buffer y enviar
      const buf = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=plantilla_clientes.xlsx');
      res.send(buf);
    } catch (err) {
      console.error('Error al generar plantilla Excel:', err);
      res.status(500).json({ error: 'Error al generar la plantilla' });
    }
  });

  // ✅ Resto del código (carga masiva, listar clientes, etc.)
  router.post('/api/carga-directa', async (req: Request, res: Response) => {
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: 'Contenido CSV no proporcionado' });
    }

    try {
      const lines = csvContent
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line !== '');

      if (lines.length < 2) {
        return res.status(400).json({ error: 'El archivo debe tener encabezado y datos' });
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

        for (let i = 1; i < lines.length; i++) {
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

  return router;
};