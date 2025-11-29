// backend/src/routes/cliente.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import { JWT_SECRET } from '../services/auth.service';

const router = Router();

const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();
  const ddmmyyyy = cleanStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    const isoDate = `${year}-${month}-${day}`;
    const date = new Date(isoDate);
    if (!isNaN(date.getTime()) && date.getFullYear() == parseInt(year)) {
      return isoDate;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const date = new Date(cleanStr);
    if (!isNaN(date.getTime())) {
      return cleanStr;
    }
  }
  return null;
};

export const clienteRoutes = (pool: Pool) => {
  // ... código de endpoints ...

  // ✅ ¡DEVUELVE EL ROUTER!
  return router;
};