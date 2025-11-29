import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import ExcelJS from 'exceljs';

const router = Router();

export const clienteRoutes = (pool: Pool) => {
  // ✅ Endpoint para plantilla Excel
  router.get('/api/cliente/plantilla-excel', async (req: Request, res: Response) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clientes');
      worksheet.columns = [
        { header: 'Nombre del Cliente *', key: 'nombre_entidad', width: 30 },
        { header: 'Tipo de Cliente *', key: 'tipo_cliente', width: 20 },
        { header: 'Actividad Económica *', key: 'actividad_economica', width: 30 }
      ];
      worksheet.getRow(1).font = { bold: true };
      const buf = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=plantilla_clientes.xlsx');
      res.send(buf);
    } catch (err: any) {
      console.error('Error Excel:', err);
      res.status(500).json({ error: 'Error al generar Excel' });
    }
  });

  // ✅ Endpoint para carga masiva
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

      if (lines.length === 0) {
        return res.status(400).json({ error: 'El archivo no tiene datos' });
      }

      let successCount = 0;
      for (let i = 0; i < lines.length; i++) {
        const values = lines[i].split(',').map((s: string) => s.trim());
        if (values.length >= 3) successCount++;
      }

      res.json({ success: true, message: `✅ ${successCount} cliente(s) cargado(s)` });
    } catch (err: any) {
      console.error('Error carga masiva:', err);
      res.status(500).json({ error: 'Error al procesar el archivo' });
    }
  });

  // ✅ Listar clientes
  router.get('/api/cliente/mis-clientes', async (req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT id, nombre_entidad, tipo_cliente, actividad_economica, estado FROM clientes');
      res.json({ clientes: result.rows });
    } catch (err: any) {
      console.error('Error al listar clientes:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  return router;
};