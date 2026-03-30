import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';
import { AuthError } from '../utils/errors';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  zoneId: string | null;
  stateId: string | null;
  lgaId: string | null;
  wardId: string | null;
  pollingUnitId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        zoneId: true,
        stateId: true,
        lgaId: true,
        wardId: true,
        pollingUnitId: true,
      },
    });

    if (!user) {
      throw new AuthError('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new AuthError('Account is not active');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      zoneId: user.zoneId,
      stateId: user.stateId,
      lgaId: user.lgaId,
      wardId: user.wardId,
      pollingUnitId: user.pollingUnitId,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AuthError('Invalid token'));
    } else if (err instanceof jwt.TokenExpiredError) {
      next(new AuthError('Token expired'));
    } else {
      next(err);
    }
  }
}
