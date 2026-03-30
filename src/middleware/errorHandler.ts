import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/apiResponse';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(`❌ Error: ${err.message}`, err.stack);

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message);
  }

  // Prisma known request error
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const target = prismaErr.meta?.target?.join(', ') || 'field';
      return sendError(res, 409, 'CONFLICT', `A record with this ${target} already exists`);
    }
    if (prismaErr.code === 'P2025') {
      return sendError(res, 404, 'NOT_FOUND', 'Record not found');
    }
  }

  // Multer file size error
  if (err.constructor.name === 'MulterError' && (err as any).code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 400, 'FILE_TOO_LARGE', 'File exceeds the maximum allowed size');
  }

  // Default to 500
  return sendError(res, 500, 'INTERNAL_ERROR', 
    process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  );
}
