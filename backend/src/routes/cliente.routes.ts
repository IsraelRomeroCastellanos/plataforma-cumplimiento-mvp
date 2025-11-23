// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import * as ExcelJS from 'exceljs';
import { JWT_SECRET } from '../services/auth.service';

const router = Router();

export const clienteRoutes = (pool: Pool) => {
  router.get('/api/cliente/plantilla', async (req, res) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clientes');

      worksheet.columns = [
        { header: 'Nombre del Cliente *', key: 'nombre_entidad', width: 30 },
        { header: 'Tipo de Cliente *', key: 'tipo_cliente', width: 20 },
        { header: 'Actividad Económica *', key: 'actividad_economica', width: 30 },
        { header: 'Estado del Bien', key: 'estado_bien', width: 15 },
        { header: 'Alias', key: 'alias', width: 20 }
      ];

      // ✅ Validaciones CORRECTAS para Excel
      worksheet.getColumn('B').eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber > 1) {
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['persona_fisica,persona_moral'],
            showErrorMessage: true,
            errorTitle: 'Tipo inválido',
            error: 'Use: persona_fisica o persona_moral'
          };
        }
      });

      worksheet.getColumn('D').eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber > 1) {
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['Nuevo,Usado,Viejo'],
            showErrorMessage: true,
            errorTitle: 'Estado inválido',
            error: 'Seleccione: Nuevo, Usado o Viejo'
          };
        }
      });

      worksheet.getRow(1).font = { bold: true };

      const buf = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=plantilla_clientes.xlsx');
      res.send(buf);
    } catch (err) {
      console.error('Error al generar plantilla Excel:', err);
      res.status(500).json({ error: 'Error al generar la plantilla' });
    }
  });

  // ... resto del código (carga masiva, listar clientes, etc.) ...
};