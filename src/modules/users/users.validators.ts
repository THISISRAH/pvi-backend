import { z } from 'zod';
import { UserRole, UserStatus, Gender } from '@prisma/client';

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^(\+234|0)[0-9]{10}$/).optional(),
  gender: z.nativeEnum(Gender).optional(),
  dateOfBirth: z.string().datetime().optional(),
  occupation: z.string().max(100).optional(),

  hasPvc: z.boolean().optional(),
  zoneId: z.string().uuid().optional(),
  stateId: z.string().uuid().optional(),
  lgaId: z.string().uuid().optional(),
  wardId: z.string().uuid().optional(),
  pollingUnitId: z.string().uuid().optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  stateId: z.string().uuid().optional(),
  lgaId: z.string().uuid().optional(),
  wardId: z.string().uuid().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  gender: z.nativeEnum(Gender).optional(),
  hasPvc: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
