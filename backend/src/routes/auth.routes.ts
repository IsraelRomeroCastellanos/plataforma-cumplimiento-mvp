import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

export const authRoutes = (pool: Pool) => {
  return router;
};