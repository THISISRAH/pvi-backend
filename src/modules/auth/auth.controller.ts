import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/apiResponse';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      sendSuccess(res, { user, message: 'Registration successful. Please verify your email with the OTP sent.' }, 201);
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const user = await authService.verifyOtp(email, otp);
      sendSuccess(res, { user, message: 'Email verified successfully' });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await authService.login(req.body, ipAddress, userAgent);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, tokens);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      await authService.logout(req.user!.id, ipAddress, userAgent);
      sendSuccess(res, { message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      sendSuccess(res, { message: 'If an account exists, a reset code has been sent' });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = req.body;
      await authService.resetPassword(email, otp, newPassword);
      sendSuccess(res, { message: 'Password reset successfully' });
    } catch (err) {
      next(err);
    }
  }

  async request2FA(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.request2FA(req.user!.id);
      sendSuccess(res, { message: '2FA code sent to your email' });
    } catch (err) {
      next(err);
    }
  }

  async verify2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const { otp } = req.body;
      await authService.verify2FA(req.user!.id, otp);
      sendSuccess(res, { message: '2FA enabled successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
