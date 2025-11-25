import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles } from '../../middleware';
import * as service from './romaneios.service';
import { gerarRomaneioSchema, updateRomaneioSchema } from './romaneios.schema';

const router = Router();

// GET /api/v1/romaneios
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const result = await service.list({
      tenantId: req.tenantId!,
      page,
      limit,
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

// GET /api/v1/romaneios/:id
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

// POST /api/v1/romaneios/gerar
router.post(
  '/gerar',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'comprador'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = gerarRomaneioSchema.parse(req.body);
      const item = await service.gerar(req.tenantId!, req.user!.user_id, input);

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/romaneios/:id
router.put(
  '/:id',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'comprador'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateRomaneioSchema.parse(req.body);
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

// POST /api/v1/romaneios/:id/finalizar
router.post(
  '/:id/finalizar',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'comprador'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await service.finalizar(req.tenantId!, req.params.id);

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/romaneios/:id/cancelar
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
