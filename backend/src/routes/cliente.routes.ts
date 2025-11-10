// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { verifyToken } from '../services/auth.service';

const router = Router();
const saltRounds = 10;

export const clienteRoutes = (pool: Pool) => {
  // Registro de cliente (formulario público - solo para pruebas internas)
  router.post('/api/cliente', async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const {
        email,
        password,
        nombre_completo,
        nombre_empresa,
        rfc,
        tipo_entidad = 'persona_moral',
        nombre_cliente,
        tipo_cliente = 'persona_fisica',
        actividad_economica = 'otro'
      } = req.body;

      if (!email || !password || !nombre_empresa || !nombre_cliente || !nombre_completo) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      await client.query('BEGIN');

      // Crear empresa
      const empresaResult = await client.query(
        'INSERT INTO empresas (nombre_legal, rfc, tipo_entidad) VALUES ($1, $2, $3) RETURNING id',
        [nombre_empresa, rfc || null, tipo_entidad]
      );
      const empresaId = empresaResult.rows[0].id;

      // Hashear contraseña
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Crear usuario
      await client.query(
        'INSERT INTO usuarios (email, password_hash, nombre_completo, rol, empresa_id) VALUES ($1, $2, $3, $4, $5)',
        [email, passwordHash, nombre_completo, 'cliente', empresaId]
      );

      // Crear cliente
      await client.query(
        'INSERT INTO clientes (empresa_id, nombre_entidad, tipo_cliente, actividad_economica, porcentaje_cumplimiento) VALUES ($1, $2, $3, $4, 0)',
        [empresaId, nombre_cliente, tipo_cliente, actividad_economica]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Cliente registrado exitosamente'
      });

    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Error al registrar cliente:', err);

      if (err.code === '23505' && err.constraint === 'usuarios_email_key') {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }

      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      client.release();
    }
  });

  // Registrar cliente unitario (para usuarios autenticados con rol cliente)
  router.post('/api/cliente/registrar', async (req: Request, res: Response) => {
    // Verificar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
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

    // Validaciones básicas
    if (!nombre_entidad || !tipo_cliente || !actividad_economica) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: nombre_entidad, tipo_cliente, actividad_economica' });
    }

    if (!['persona_fisica', 'persona_moral'].includes(tipo_cliente)) {
      return res.status(400).json({ error: 'Tipo de cliente no válido' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar unicidad: mismo nombre_entidad en la misma empresa
      const duplicateCheck = await client.query(
        'SELECT id FROM clientes WHERE empresa_id = $1 AND nombre_entidad = $2',
        [payload.empresaId, nombre_entidad]
      );
      if (duplicateCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Ya existe un cliente con ese nombre en esta empresa' });
      }

      // Insertar cliente
      const result = await client.query(
        `INSERT INTO clientes 
         (empresa_id, nombre_entidad, alias, fecha_nacimiento_constitucion, nacionalidad, domicilio_mexico, ocupacion, tipo_cliente, actividad_economica, porcentaje_cumplimiento, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 'activo')
         RETURNING id`,
        [
          payload.empresaId,
          nombre_entidad,
          alias || null,
          fecha_nacimiento_constitucion || null,
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
      
      // Manejo específico de violación de unicidad
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Cliente duplicado en esta empresa' });
      }

      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      client.release();
    }
  });

  // Carga masiva de clientes
  router.post('/api/cliente/carga-masiva', async (req: Request, res: Response) => {
    // Verificar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'cliente') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Verificar que se envió un archivo
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'Archivo no proporcionado' });
    }

    const file = req.files.file as any;
    const content = file.data.toString('utf-8');
    const lines = content.split('\n').filter((line: string) => line.trim() !== '');
    
    if (lines.length < 2) {
      return res.status(400).json({ error: 'El archivo está vacío o no tiene datos' });
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

        const empresaId = (payload as any).empresaId;
        if (!empresaId) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'El usuario no tiene empresa asignada' });
        }

        // Verificar unicidad en la misma empresa
        const duplicateCheck = await client.query(
          'SELECT id FROM clientes WHERE empresa_id = $1 AND nombre_entidad = $2',
          [empresaId, row.nombre_entidad]
        );
        if (duplicateCheck.rows.length > 0) {
          continue; // Opcional: podrías registrar error
        }

        await client.query(
          `INSERT INTO clientes (empresa_id, nombre_entidad, alias, fecha_nacimiento_constitucion, nacionalidad, domicilio_mexico, ocupacion, tipo_cliente, actividad_economica, porcentaje_cumplimiento, estado)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 'activo')`,
          [
            empresaId,
            row.nombre_entidad,
            row.alias || null,
            row.fecha_nacimiento_constitucion || null,
            row.nacionalidad || null,
            row.domicilio_mexico || null,
            row.ocupacion || null,
            row.tipo_cliente,
            row.actividad_economica
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

  return router;
};