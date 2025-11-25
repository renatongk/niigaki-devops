import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles, requireLojaAccess } from '../../middleware';
import * as lojasService from './lojas.service';
import { createLojaSchema, updateLojaSchema } from './lojas.schema';

const router = Router();

// GET /api/v1/lojas
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;

    // Filter by user's allowed stores if not admin
    const lojasPermitidas = 
      req.user?.roles.includes('tenant_owner') || req.user?.roles.includes('gestor')
        ? undefined
        : req.user?.lojas_permitidas;

    const result = await lojasService.listLojas({
      tenantId: req.tenantId!,
      page,
      limit,
      ativo,
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

// GET /api/v1/lojas/:id
router.get('/:id', authenticate, requireLojaAccess(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loja = await lojasService.getLoja(req.tenantId!, req.params.id);

    res.json({
      success: true,
      data: loja,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/lojas
router.post(
  '/',
  authenticate,
  requireRoles('tenant_owner', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createLojaSchema.parse(req.body);
      const loja = await lojasService.createLoja(req.tenantId!, input);

      res.status(201).json({
        success: true,
        data: loja,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/lojas/:id
router.put(
  '/:id',
  authenticate,
  requireRoles('tenant_owner', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateLojaSchema.parse(req.body);
      const loja = await lojasService.updateLoja(req.tenantId!, req.params.id, input);

      res.json({
        success: true,
        data: loja,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/lojas/:id
router.delete(
  '/:id',
  authenticate,
  requireRoles('tenant_owner', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await lojasService.deleteLoja(req.tenantId!, req.params.id);

      res.json({
        success: true,
        message: 'Loja removida com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
