import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles } from '../../middleware';
import * as service from './embalagens-retornaveis.service';
import { ajusteMovimentoSchema } from './embalagens-retornaveis.schema';

const router = Router();

// GET /api/v1/embalagens/saldos
router.get('/saldos', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const loja_id = req.query.loja_id as string | undefined;
    const embalagem_id = req.query.embalagem_id as string | undefined;

    const result = await service.listSaldos({
      tenantId: req.tenantId!,
      page,
      limit,
      loja_id,
      embalagem_id,
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

// GET /api/v1/embalagens/movimentos
router.get('/movimentos', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const loja_id = req.query.loja_id as string | undefined;
    const embalagem_id = req.query.embalagem_id as string | undefined;
    const tipo = req.query.tipo as string | undefined;

    const result = await service.listMovimentos({
      tenantId: req.tenantId!,
      page,
      limit,
      loja_id,
      embalagem_id,
      tipo,
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

// POST /api/v1/embalagens/movimentos/ajuste
router.post(
  '/movimentos/ajuste',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'comprador'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = ajusteMovimentoSchema.parse(req.body);
      const item = await service.ajuste(req.tenantId!, input);

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
