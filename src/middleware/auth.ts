import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { JWTPayload, Role, UserAttributes } from '../types';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      tenantId?: string;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Token de autenticação não fornecido',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    req.user = decoded;
    req.tenantId = decoded.tenant_id;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expirado',
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      error: 'Token inválido',
    });
  }
}

// RBAC - Role-based access control middleware
export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado. Permissão insuficiente.',
      });
      return;
    }

    next();
  };
}

// ABAC - Attribute-based access control middleware
export function requireAttribute(attribute: keyof UserAttributes) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
      return;
    }

    const atributos = req.user.atributos || {};
    
    if (attribute === 'lojas_permitidas') {
      // Special handling for lojas_permitidas - just check if user has any
      if (!atributos.lojas_permitidas || atributos.lojas_permitidas.length === 0) {
        // Allow if user has tenant_owner or gestor role
        if (!req.user.roles.includes('tenant_owner') && !req.user.roles.includes('gestor')) {
          res.status(403).json({
            success: false,
            error: 'Usuário não tem permissão para nenhuma loja',
          });
          return;
        }
      }
    } else {
      if (!atributos[attribute]) {
        res.status(403).json({
          success: false,
          error: `Acesso negado. Atributo '${attribute}' não permitido.`,
        });
        return;
      }
    }

    next();
  };
}

// ABAC - Check if user has access to a specific store
export function requireLojaAccess(lojaIdParam: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
      return;
    }

    // Tenant owners and gestors have access to all stores
    if (req.user.roles.includes('tenant_owner') || req.user.roles.includes('gestor')) {
      next();
      return;
    }

    const lojaId = req.params[lojaIdParam] || req.body?.loja_id;
    
    if (!lojaId) {
      next();
      return;
    }

    const lojasPermitidas = req.user.lojas_permitidas || [];
    
    if (!lojasPermitidas.includes(lojaId)) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado. Usuário não tem permissão para esta loja.',
      });
      return;
    }

    next();
  };
}
