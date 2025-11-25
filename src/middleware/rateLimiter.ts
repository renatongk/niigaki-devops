import rateLimit from 'express-rate-limit';

// General API rate limiter - 100 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns instantes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for authentication endpoints - 5 requests per minute
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em alguns instantes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for create/update operations - 30 requests per minute
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: 'Muitas operações de escrita. Tente novamente em alguns instantes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
