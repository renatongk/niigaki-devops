import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles, requireAttribute } from '../../middleware';
import * as service from './logs.service';

const router = Router();

// GET /api/v1/logs
router.get(
  '/',
  authenticate,
  requireRoles('tenant_owner', 'auditor'),
  requireAttribute('perfil_auditoria'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const user_id = req.query.user_id as string | undefined;
      const action = req.query.action as string | undefined;
      const entity_type = req.query.entity_type as string | undefined;
      const data_inicio = req.query.data_inicio as string | undefined;
      const data_fim = req.query.data_fim as string | undefined;

      const result = await service.list({
        tenantId: req.tenantId!,
        page,
        limit,
        user_id,
        action,
        entity_type,
        data_inicio,
        data_fim,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
