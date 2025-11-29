// backend/src/routes/admin.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

export const adminRoutes = (pool: Pool) => {
  // ... código de endpoints ...

  // ✅ ¡DEVUELVE EL ROUTER!
  return router;
};
``>

---

## 📁 **4. Archivo completo: `backend/src/routes/auth.routes.ts`**

```ts
// backend/src/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../services/auth.service';

const router = Router();

export const authRoutes = (pool: Pool) => {
  // ... código de endpoints ...

  // ✅ ¡DEVUELVE EL ROUTER!
  return router;
};