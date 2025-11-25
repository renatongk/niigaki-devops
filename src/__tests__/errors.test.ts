import { 
  AppError, 
  NotFoundError, 
  ValidationError, 
  UnauthorizedError, 
  ForbiddenError,
  ConflictError 
} from '../middleware';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with default status code 500', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should create error with custom status code', () => {
      const error = new AppError('Test error', 400);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error with default message', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Recurso não encontrado');
      expect(error.statusCode).toBe(404);
    });

    it('should create 404 error with custom message', () => {
      const error = new NotFoundError('Usuário não encontrado');
      expect(error.message).toBe('Usuário não encontrado');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ValidationError', () => {
    it('should create 400 error', () => {
      const error = new ValidationError('Campo inválido');
      expect(error.message).toBe('Campo inválido');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create 401 error', () => {
      const error = new UnauthorizedError('Token inválido');
      expect(error.message).toBe('Token inválido');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create 403 error', () => {
      const error = new ForbiddenError('Sem permissão');
      expect(error.message).toBe('Sem permissão');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('ConflictError', () => {
    it('should create 409 error', () => {
      const error = new ConflictError('Registro duplicado');
      expect(error.message).toBe('Registro duplicado');
      expect(error.statusCode).toBe(409);
    });
  });
});
