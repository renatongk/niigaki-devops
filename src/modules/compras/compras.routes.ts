import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles, requireAttribute } from '../../middleware';
import * as service from './compras.service';
import { createCompraSchema, updateCompraSchema } from './compras.schema';

const router = Router();

// GET /api/v1/compras
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const fornecedor_id = req.query.fornecedor_id as string | undefined;
    const status = req.query.status as string | undefined;

    const result = await service.list({
      tenantId: req.tenantId!,
      page,
      limit,
      fornecedor_id,
      status,
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

// GET /api/v1/compras/:id
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

// POST /api/v1/compras
router.post(
  '/',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'comprador'),
  requireAttribute('perfil_compras'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createCompraSchema.parse(req.body);
      const item = await service.create(req.tenantId!, req.user!.user_id, input);

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/compras/:id
router.put(
  '/:id',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'comprador'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateCompraSchema.parse(req.body);
      const item = await service.update(req.tenantId!, req.params.id, input);

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/compras/:id/concluir
router.post(
  '/:id/concluir',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'comprador'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await service.concluir(req.tenantId!, req.params.id);

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/compras/:id/cancelar
router.post(
  '/:id/cancelar',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'comprador'),
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
