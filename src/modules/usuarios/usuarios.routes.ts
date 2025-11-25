import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles } from '../../middleware';
import * as usuariosService from './usuarios.service';
import { createUsuarioSchema, updateUsuarioSchema, updateRolesSchema, updateLojasSchema } from './usuarios.schema';

const router = Router();

// GET /api/v1/usuarios
router.get(
  '/',
  authenticate,
  requireRoles('tenant_owner', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;

      const result = await usuariosService.listUsuarios({
        tenantId: req.tenantId!,
        page,
        limit,
        ativo,
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

// GET /api/v1/usuarios/:id
router.get(
  '/:id',
  authenticate,
  requireRoles('tenant_owner', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = await usuariosService.getUsuario(req.tenantId!, req.params.id);

      res.json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/usuarios
router.post(
  '/',
  authenticate,
  requireRoles('tenant_owner', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createUsuarioSchema.parse(req.body);
      const usuario = await usuariosService.createUsuario(req.tenantId!, input);

      res.status(201).json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/usuarios/:id
router.put(
  '/:id',
  authenticate,
  requireRoles('tenant_owner', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateUsuarioSchema.parse(req.body);
      const usuario = await usuariosService.updateUsuario(req.tenantId!, req.params.id, input);

      res.json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/usuarios/:id
router.delete(
  '/:id',
  authenticate,
  requireRoles('tenant_owner'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await usuariosService.deleteUsuario(req.tenantId!, req.params.id);

      res.json({
        success: true,
        message: 'Usuário removido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/usuarios/:id/roles
router.post(
  '/:id/roles',
  authenticate,
  requireRoles('tenant_owner'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateRolesSchema.parse(req.body);
      const usuario = await usuariosService.updateRoles(req.tenantId!, req.params.id, input);

      res.json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/usuarios/:id/lojas
router.post(
  '/:id/lojas',
  authenticate,
  requireRoles('tenant_owner', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateLojasSchema.parse(req.body);
      const usuario = await usuariosService.updateLojas(req.tenantId!, req.params.id, input);

      res.json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
