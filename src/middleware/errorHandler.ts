import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import config from '../config';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Dados inválidos') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflito de dados') {
    super(message, 409);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    
    res.status(400).json({
      success: false,
      error: 'Erro de validação',
      details: errors,
    });
    return;
  }

  // Application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // PostgreSQL unique constraint violation
  const errWithCode = err as Error & { code?: string };
  if (errWithCode.code === '23505') {
    res.status(409).json({
      success: false,
      error: 'Registro duplicado',
    });
    return;
  }

  // PostgreSQL foreign key violation
  if (errWithCode.code === '23503') {
    res.status(400).json({
      success: false,
      error: 'Referência inválida',
    });
    return;
  }

  // Log unhandled errors in development
  if (config.server.nodeEnv === 'development') {
    console.error('Unhandled error:', err);
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: config.server.nodeEnv === 'development' 
      ? err.message 
      : 'Erro interno do servidor',
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
  });
}
