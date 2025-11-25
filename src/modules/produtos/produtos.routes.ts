import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles } from '../../middleware';
import * as service from './produtos.service';
import { createProdutoSchema, updateProdutoSchema } from './produtos.schema';

const router = Router();

// GET /api/v1/produtos
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;
    const categoria_id = req.query.categoria_id as string | undefined;

    const result = await service.list({
      tenantId: req.tenantId!,
      page,
      limit,
      ativo,
      categoria_id,
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

// GET /api/v1/produtos/:id
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

// POST /api/v1/produtos
router.post(
  '/',
  authenticate,
  requireRoles('tenant_owner', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createProdutoSchema.parse(req.body);
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

// PUT /api/v1/produtos/:id
router.put(
  '/:id',
  authenticate,
  requireRoles('tenant_owner', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateProdutoSchema.parse(req.body);
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

// DELETE /api/v1/produtos/:id
router.delete(
  '/:id',
  authenticate,
  requireRoles('tenant_owner', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.remove(req.tenantId!, req.params.id);

      res.json({
        success: true,
        message: 'Produto removido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
