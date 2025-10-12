// backend/src/services/auth.service.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export const generateToken = (userId: number, email: string, role: string) => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
  } catch (err) {
    return null;
  }
};