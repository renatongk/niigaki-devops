import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles } from '../../middleware';
import * as service from './relatorios.service';

const router = Router();

// GET /api/v1/relatorios/compras
router.get(
  '/compras',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'auditor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data_inicio = req.query.data_inicio as string | undefined;
      const data_fim = req.query.data_fim as string | undefined;
      const fornecedor_id = req.query.fornecedor_id as string | undefined;

      const result = await service.relatorioCompras({
        tenantId: req.tenantId!,
        data_inicio,
        data_fim,
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

// GET /api/v1/relatorios/romaneios
router.get(
  '/romaneios',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'auditor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data_inicio = req.query.data_inicio as string | undefined;
      const data_fim = req.query.data_fim as string | undefined;
      const loja_id = req.query.loja_id as string | undefined;

      const result = await service.relatorioRomaneios({
        tenantId: req.tenantId!,
        data_inicio,
        data_fim,
        loja_id,
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

// GET /api/v1/relatorios/financeiro
router.get(
  '/financeiro',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'financeiro', 'auditor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data_inicio = req.query.data_inicio as string | undefined;
      const data_fim = req.query.data_fim as string | undefined;
      const loja_id = req.query.loja_id as string | undefined;
      const fornecedor_id = req.query.fornecedor_id as string | undefined;

      const result = await service.relatorioFinanceiro({
        tenantId: req.tenantId!,
        data_inicio,
        data_fim,
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

// GET /api/v1/relatorios/embalagens
router.get(
  '/embalagens',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'auditor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loja_id = req.query.loja_id as string | undefined;

      const result = await service.relatorioEmbalagens({
        tenantId: req.tenantId!,
        loja_id,
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

// GET /api/v1/relatorios/devolucoes
router.get(
  '/devolucoes',
  authenticate,
  requireRoles('tenant_owner', 'gestor', 'auditor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data_inicio = req.query.data_inicio as string | undefined;
      const data_fim = req.query.data_fim as string | undefined;
      const loja_id = req.query.loja_id as string | undefined;

      const result = await service.relatorioDevolucoes({
        tenantId: req.tenantId!,
        data_inicio,
        data_fim,
        loja_id,
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

export default router;
