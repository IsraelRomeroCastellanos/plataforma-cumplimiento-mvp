// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import { JWT_SECRET } from '../services/auth.service';

const router = Router();

export const clienteRoutes = (pool: Pool) => {
  // ✅ Plantilla Excel con listas desplegables (sintaxis correcta)
  router.get('/api/cliente/plantilla-excel', async (req, res) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clientes');

      // Definir columnas
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

      // ✅ Sintaxis correcta para listas desplegables en ExcelJS
      worksheet.dataValidations.add('B2:B1000', {
        type: 'list',
        allowBlank: true,
        formulae: ['"persona_fisica,persona_moral"']
      });

      worksheet.dataValidations.add('D2:D1000', {
        type: 'list',
        allowBlank: true,
        formulae: ['"Nuevo,Usado,Viejo"']
      });

      // Formato de encabezado
      worksheet.getRow(1).font = { bold: true };

      // Generar y enviar
      const buf = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=plantilla_clientes.xlsx');
      res.send(buf);
    } catch (err) {
      console.error('Error Excel:', err);
      res.status(500).json({ error: 'Error al generar Excel' });
    }
  });

  // ... resto del código (carga masiva, listar clientes, etc.) ...
};