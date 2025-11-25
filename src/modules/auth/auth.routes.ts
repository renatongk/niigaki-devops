import { Router, Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { loginSchema, refreshTokenSchema } from './auth.schema';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refresh_token } = refreshTokenSchema.parse(req.body);
    const result = await authService.refreshToken(refresh_token);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
