// backend/src/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../services/auth.service';
import { verifyToken } from '../services/auth.service';

const router = Router();

export const authRoutes = (pool: Pool) => {
  // Login
  router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    try {
      const result = await pool.query(
        'SELECT id, email, password_hash, rol, empresa_id FROM usuarios WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const user = result.rows[0];
      const cleanPassword = password.trim();
      const cleanEmail = email.trim();

      const isValid = await new Promise<boolean>((resolve, reject) => {
        bcrypt.compare(cleanPassword, user.password_hash, (err, isMatch) => {
          if (err) {
            console.error('Error en comparación de contraseña:', err);
            reject(err);
          } else {
            resolve(isMatch);
          }
        });
      });

      if (!isValid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.rol,
          empresaId: user.empresa_id
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.rol,
          empresaId: user.empresa_id
        }
      });

    } catch (err) {
      console.error('Error en login:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Cambiar contraseña
  router.post('/api/cambiar-contrasena', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { contrasenaActual, nuevaContrasena } = req.body;
    
    if (!contrasenaActual || !nuevaContrasena) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
      const userResult = await pool.query(
        'SELECT password_hash FROM usuarios WHERE id = $1',
        [payload.userId]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const isValid = await bcrypt.compare(contrasenaActual, userResult.rows[0].password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }

      const newPasswordHash = await bcrypt.hash(nuevaContrasena, 10);
      await pool.query(
        'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, payload.userId]
      );

      res.json({ success: true, message: 'Contraseña actualizada' });
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  return router;
};