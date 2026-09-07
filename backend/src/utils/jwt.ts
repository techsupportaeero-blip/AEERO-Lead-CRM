import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Role } from '../types/index.js';

export interface TokenPayload {
  userId: number;
  username: string;
  name: string;
  email: string;
  role: Role;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}
