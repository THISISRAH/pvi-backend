import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';
import { AuthUser } from './auth';

/**
 * Jurisdiction middleware — ensures users can only access data within their area.
 * 
 * National Admin: access everything
 * Zonal Coordinator: access only their zone
 * State Coordinator: access only their state (and zones above)
 * LGA Coordinator: access only their LGA (and state/zone above)
 * Ward Leader: access only their ward
 * Polling Agent: access only their polling unit
 */
export function checkJurisdiction(scopeField: 'zoneId' | 'stateId' | 'lgaId' | 'wardId' | 'pollingUnitId') {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    // National Admin can access everything
    if (req.user.role === 'NATIONAL_ADMIN') {
      return next();
    }

    // Get the scope value from query, params, or body
    const scopeValue = req.query[scopeField] || req.params[scopeField] || req.body?.[scopeField];

    if (!scopeValue) {
      return next(); // No specific scope requested, filtering will be done in service layer
    }

    // Check if the user's jurisdiction matches the requested scope
    const userScopeValue = req.user[scopeField];

    if (userScopeValue && userScopeValue !== scopeValue) {
      return next(new ForbiddenError('You do not have access to this jurisdiction'));
    }

    next();
  };
}

/**
 * Build a jurisdiction filter for Prisma queries based on user's role.
 * Returns a filter object to add to Prisma where clauses.
 */
export function buildJurisdictionFilter(user: AuthUser): Record<string, string> {
  const filter: Record<string, string> = {};

  switch (user.role) {
    case 'NATIONAL_ADMIN':
      // No filter — access everything
      break;
    case 'ZONAL_COORDINATOR':
      if (user.zoneId) filter.zoneId = user.zoneId;
      break;
    case 'STATE_COORDINATOR':
      if (user.stateId) filter.stateId = user.stateId;
      break;
    case 'LGA_COORDINATOR':
      if (user.lgaId) filter.lgaId = user.lgaId;
      break;
    case 'WARD_LEADER':
      if (user.wardId) filter.wardId = user.wardId;
      break;
    case 'POLLING_AGENT':
      if (user.pollingUnitId) filter.pollingUnitId = user.pollingUnitId;
      break;
    default:
      // VOLUNTEER and MEMBER — restricted to their own ward
      if (user.wardId) filter.wardId = user.wardId;
      break;
  }

  return filter;
}
