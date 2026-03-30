import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ForbiddenError } from '../utils/errors';
import { ROLE_HIERARCHY } from '../config/constants';

/**
 * Check if user has one of the allowed roles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role ${req.user.role} is not authorised for this action`));
    }

    next();
  };
}

/**
 * Check if user's role is at or above a minimum level.
 */
export function requireMinRole(minRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;

    if (userLevel < requiredLevel) {
      return next(new ForbiddenError(`Minimum role of ${minRole} required`));
    }

    next();
  };
}

/**
 * Check if user role is higher than target role (for managing subordinates).
 */
export function isHigherRole(userRole: UserRole, targetRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) > (ROLE_HIERARCHY[targetRole] ?? 0);
}
