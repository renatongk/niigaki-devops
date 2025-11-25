import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import { JWTPayload } from '../types';

export function generateUUID(): string {
  return uuidv4();
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
  // Convert expiresIn to seconds if it's a string like "24h"
  const expiresIn = config.jwt.expiresIn;
  return jwt.sign(payload as object, config.jwt.secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(payload: JWTPayload): string {
  const expiresIn = config.jwt.refreshExpiresIn;
  return jwt.sign(payload as object, config.jwt.secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
}

export function paginate(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  return { offset, limit: Math.min(limit, 100) };
}

export function formatPaginationResponse(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
