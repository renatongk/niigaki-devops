import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles, requireLojaAccess } from '../../middleware';
import * as service from './devolucoes.service';
import { createDevolucaoSchema } from './devolucoes.schema';

const router = Router();

// GET /api/v1/devolucoes
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const loja_id = req.query.loja_id as string | undefined;
    const status = req.query.status as string | undefined;

    // Filter by user's allowed stores if not admin
    const lojasPermitidas =
      req.user?.roles.includes('tenant_owner') || req.user?.roles.includes('gestor')
        ? undefined
        : req.user?.lojas_permitidas;

    const result = await service.list({
      tenantId: req.tenantId!,
      page,
      limit,
      loja_id,
      status,
      lojasPermitidas,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/devolucoes/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await service.getById(req.tenantId!, req.params.id);

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/devolucoes
router.post(
  '/',
  authenticate,
  requireLojaAccess('loja_id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createDevolucaoSchema.parse(req.body);
      const item = await service.create(req.tenantId!, input);

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/devolucoes/:id/processar
router.post(
  '/:id/processar',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'comprador'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await service.processar(req.tenantId!, req.params.id);

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/devolucoes/:id/cancelar
router.post(
  '/:id/cancelar',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await service.cancelar(req.tenantId!, req.params.id);

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
