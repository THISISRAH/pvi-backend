import { z } from 'zod';
import { Gender } from '@prisma/client';

export const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^(\+234|0)[0-9]{10}$/, 'Invalid Nigerian phone number'),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  gender: z.nativeEnum(Gender).optional(),
  dateOfBirth: z.string().datetime().optional(),
  occupation: z.string().max(100).optional(),

  zoneId: z.string().uuid().optional(),
  stateId: z.string().uuid().optional(),
  lgaId: z.string().uuid().optional(),
  wardId: z.string().uuid().optional(),
  pollingUnitId: z.string().uuid().optional(),
  voterId: z.string().optional(),
  nin: z.string().optional(),
  hasPvc: z.boolean().default(false),
  consentGiven: z.boolean().refine(val => val === true, {
    message: 'You must consent to NDPA data processing terms',
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8).max(100),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
