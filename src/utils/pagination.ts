import { Request } from 'express';
import { PAGINATION_DEFAULTS } from '../config/constants';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sort: string;
  order: 'asc' | 'desc';
}

export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || PAGINATION_DEFAULTS.PAGE);
  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(1, parseInt(req.query.limit as string) || PAGINATION_DEFAULTS.LIMIT)
  );
  const sort = (req.query.sort as string) || 'createdAt';
  const order = (req.query.order as string) === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sort,
    order,
  };
}
