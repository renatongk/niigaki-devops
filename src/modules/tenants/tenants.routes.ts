import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles } from '../../middleware';
import * as tenantsService from './tenants.service';
import { updateTenantSchema } from './tenants.schema';

const router = Router();

// GET /api/v1/tenants/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await tenantsService.getTenant(req.tenantId!);
    
    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/tenants/me
router.put(
  '/me',
  authenticate,
  requireRoles('tenant_owner'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateTenantSchema.parse(req.body);
      const tenant = await tenantsService.updateTenant(req.tenantId!, input);
      
      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
