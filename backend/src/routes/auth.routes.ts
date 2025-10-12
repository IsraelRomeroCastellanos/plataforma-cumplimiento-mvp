// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { generateToken } from '../services/auth.service';

const router = Router();

export const authRoutes = (pool: Pool) => {
  router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    try {
      const result = await pool.query(
        'SELECT id, email, password_hash, rol FROM usuarios WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = generateToken(user.id, user.email, user.rol);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.rol
        }
      });

    } catch (err) {
      console.error('Error en login:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  return router;
};