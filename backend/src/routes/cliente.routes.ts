import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

export const clienteRoutes = (pool: Pool) => {
  router.post('/api/cliente/registrar', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const token = authHeader.split(' ')[1];
    let payload;
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
      payload = require('jsonwebtoken').verify(token, JWT_SECRET) as any;
    } catch (err: any) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const {
      nombre_entidad,
      tipo_cliente,
      actividad_economica
    } = req.body;

    if (!nombre_entidad || !tipo_cliente || !actividad_economica) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
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

      const result = await client.query(
        `INSERT INTO clientes (empresa_id, nombre_entidad, tipo_cliente, actividad_economica, estado)
         VALUES ($1, $2, $3, $4, 'activo') RETURNING id`,
        [empresaId, nombre_entidad, tipo_cliente, actividad_economica]
      );

      await client.query('COMMIT');
      res.status(201).json({ success: true, clienteId: result.rows[0].id });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Error al registrar cliente:', err);
      res.status(500).json({ error: 'Error al registrar cliente' });
    } finally {
      client.release();
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
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
      payload = require('jsonwebtoken').verify(token, JWT_SECRET) as any;
    } catch (err: any) {
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
          'SELECT c.id, c.nombre_entidad, c.tipo_cliente, c.actividad_economica, c.estado, e.nombre_legal as empresa FROM clientes c JOIN empresas e ON c.empresa_id = e.id ORDER BY e.nombre_legal, c.nombre_entidad'
        );
        clientes = result.rows;
      }
      res.json({ clientes });
    } catch (err: any) {
      console.error('Error al listar clientes:', err);
      res.status(500).json({ error: 'Error al cargar clientes' });
    }
  });

  return router;
};