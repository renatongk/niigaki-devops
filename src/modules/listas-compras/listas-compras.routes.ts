import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles, requireLojaAccess } from '../../middleware';
import * as service from './listas-compras.service';
import { createListaComprasSchema, updateListaComprasSchema, addItemSchema } from './listas-compras.schema';

const router = Router();

// GET /api/v1/listas-compras
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const loja_id = req.query.loja_id as string | undefined;
    const status = req.query.status as string | undefined;

    // Filter by user's allowed stores if not admin
    const lojasPermitidas =
      req.user?.roles.includes('tenant_owner') || req.user?.roles.includes('gestor') || req.user?.roles.includes('comprador')
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

// GET /api/v1/listas-compras/:id
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

// POST /api/v1/listas-compras
router.post(
  '/',
  authenticate,
  requireLojaAccess('loja_id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createListaComprasSchema.parse(req.body);
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

// PUT /api/v1/listas-compras/:id
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateListaComprasSchema.parse(req.body);
    const item = await service.update(req.tenantId!, req.params.id, input);

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/listas-compras/:id/itens
router.post('/:id/itens', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = addItemSchema.parse(req.body);
    const item = await service.addItem(req.tenantId!, req.params.id, input);

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/listas-compras/:id/enviar
router.post(
  '/:id/enviar',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await service.enviar(req.tenantId!, req.params.id);

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/listas-compras/:id/cancelar
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
