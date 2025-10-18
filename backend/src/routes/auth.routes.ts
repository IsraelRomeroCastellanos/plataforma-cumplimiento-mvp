// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export const authRoutes = (pool: Pool) => {
  router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    try {
      // Elimina espacios en blanco para evitar errores silenciosos
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      const result = await pool.query(
        'SELECT id, email, password_hash, rol, empresa_id FROM usuarios WHERE email = $1',
        [cleanEmail]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const user = result.rows[0];

      // Comparación robusta con manejo explícito de callbacks
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

  return router;
};