import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import {
  registerSchema,
  htrmRegisterSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from './auth.validators';

const router = Router();

// Rate-limited auth endpoints
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/register-htrm', authenticate, validate(htrmRegisterSchema), authController.registerHtrm);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authLimiter, validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Authenticated endpoints
router.post('/logout', authenticate, authController.logout);
router.post('/request-2fa', authenticate, authController.request2FA);
router.post('/verify-2fa', authenticate, authController.verify2FA);

export default router;
