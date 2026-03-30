import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200, meta?: PaginationMeta) {
  const response: any = { success: true, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
}

export function sendError(res: Response, statusCode: number, code: string, message: string) {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

export function sendPaginated<T>(res: Response, data: T[], total: number, page: number, limit: number) {
  return sendSuccess(res, data, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
