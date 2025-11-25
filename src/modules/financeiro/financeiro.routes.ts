import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles, requireAttribute } from '../../middleware';
import * as service from './financeiro.service';

const router = Router();

// GET /api/v1/financeiro/titulos
router.get(
  '/titulos',
  authenticate,
  requireAttribute('perfil_financeiro'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const tipo = req.query.tipo as 'loja' | 'fornecedor' | undefined;
      const status = req.query.status as string | undefined;
      const loja_id = req.query.loja_id as string | undefined;
      const fornecedor_id = req.query.fornecedor_id as string | undefined;

      const result = await service.list({
        tenantId: req.tenantId!,
        page,
        limit,
        tipo,
        status,
        loja_id,
        fornecedor_id,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/financeiro/titulos/:id
router.get(
  '/titulos/:id',
  authenticate,
  requireAttribute('perfil_financeiro'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await service.getById(req.tenantId!, req.params.id);

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/financeiro/titulos/:id/baixar
router.post(
  '/titulos/:id/baixar',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'financeiro'),
  requireAttribute('perfil_financeiro'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await service.baixar(req.tenantId!, req.params.id);

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/financeiro/titulos/:id/estornar
router.post(
  '/titulos/:id/estornar',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'financeiro'),
  requireAttribute('perfil_financeiro'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await service.estornar(req.tenantId!, req.params.id);

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
