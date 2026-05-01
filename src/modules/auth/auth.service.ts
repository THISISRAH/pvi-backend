import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { BCRYPT_ROUNDS } from '../../config/constants';
import { encrypt } from '../../services/encryption';
import { createOTP, verifyOTP } from '../../services/otp';
import { sendEmail, buildOTPEmail } from '../../services/email';
import { createAuditLog } from '../../services/auditLog';
import { AppError, AuthError, ConflictError, NotFoundError } from '../../utils/errors';
import { RegisterInput, HtrmRegisterInput, LoginInput } from './auth.validators';
import crypto from 'crypto';

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput) {
    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existing) {
      throw new ConflictError('User with this email or phone already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    // Encrypt sensitive fields
    const voterIdEnc = data.voterId ? encrypt(data.voterId) : null;
    const ninEnc = data.nin ? encrypt(data.nin) : null;

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        passwordHash,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        occupation: data.occupation,

        zoneId: data.zoneId,
        stateId: data.stateId,
        lgaId: data.lgaId,
        wardId: data.wardId,
        pollingUnitId: data.pollingUnitId,
        voterIdEnc,
        ninEnc,
        hasPvc: data.hasPvc,
        consentGiven: data.consentGiven,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    // Generate and send OTP for email verification
    const otp = await createOTP(data.email);
    await sendEmail({
      to: data.email,
      subject: 'Verify your PVI account',
      html: buildOTPEmail(data.fullName, otp),
    });

    return user;
  }

  /**
   * Register a Hard-To-Reach Member (HTRM)
   * Phone, email, password are optional.
   * Registered by a logged-in field agent on behalf of the member.
   */
  async registerHtrm(data: HtrmRegisterInput, registeredById: string) {
    // Generate placeholder values for required unique fields
    const uid = crypto.randomBytes(6).toString('hex');
    const phone = data.phone || `+2340000${uid.slice(0, 7)}`;
    const email = data.email || `htrm-${uid}@pvi.internal`;
    // Auto-generate password (HTRM members don't log in themselves)
    const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), BCRYPT_ROUNDS);

    // Check if provided phone/email already exists
    if (data.phone || data.email) {
      const conditions: any[] = [];
      if (data.phone) conditions.push({ phone: data.phone });
      if (data.email) conditions.push({ email: data.email });
      const existing = await prisma.user.findFirst({ where: { OR: conditions } });
      if (existing) {
        throw new ConflictError('A member with this phone or email already exists');
      }
    }

    // Encrypt sensitive fields
    const voterIdEnc = data.voterId ? encrypt(data.voterId) : null;
    const ninEnc = data.nin ? encrypt(data.nin) : null;

    // Create HTRM user — immediately ACTIVE (no OTP verification needed)
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        phone,
        email,
        passwordHash,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        occupation: data.occupation,

        zoneId: data.zoneId,
        stateId: data.stateId,
        lgaId: data.lgaId,
        wardId: data.wardId,
        pollingUnitId: data.pollingUnitId,
        voterIdEnc,
        ninEnc,
        hasPvc: data.hasPvc,
        consentGiven: data.consentGiven,
        registeredById,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    // Audit the HTRM registration
    await createAuditLog({
      userId: registeredById,
      action: 'CREATE',
      resourceType: 'User',
      resourceId: user.id,
      metadata: { type: 'HTRM_REGISTRATION', memberName: data.fullName },
    });

    return user;
  }

  /**
   * Verify email OTP
   */
  async verifyOtp(email: string, otp: string) {
    const valid = await verifyOTP(email, otp);
    if (!valid) {
      throw new AuthError('Invalid or expired OTP');
    }

    const user = await prisma.user.update({
      where: { email },
      data: { status: 'ACTIVE' },
      select: { id: true, fullName: true, email: true, role: true },
    });

    return user;
  }

  /**
   * Login with email + password
   */
  async login(data: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        passwordHash: true,
        role: true,
        status: true,
        twoFactorEnabled: true,
        zoneId: true,
        stateId: true,
        lgaId: true,
        wardId: true,
        pollingUnitId: true,
        profilePhotoUrl: true,
      },
    });

    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordValid) {
      throw new AuthError('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new AuthError('Your account has been suspended');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Update user's refresh token and last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        lastLoginAt: new Date(),
      },
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      ipAddress,
      userAgent,
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, refreshToken: true, status: true },
      });

      if (!user || user.refreshToken !== token) {
        throw new AuthError('Invalid refresh token');
      }

      if (user.status !== 'ACTIVE') {
        throw new AuthError('Account is not active');
      }

      const accessToken = this.generateAccessToken(user.id);
      const newRefreshToken = this.generateRefreshToken(user.id);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      if (err instanceof AuthError) throw err;
      throw new AuthError('Invalid refresh token');
    }
  }

  /**
   * Logout — clear refresh token
   */
  async logout(userId: string, ipAddress?: string, userAgent?: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await createAuditLog({
      userId,
      action: 'LOGOUT',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Forgot password — send OTP
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, fullName: true, email: true },
    });

    if (!user) {
      // Don't reveal whether user exists
      return;
    }

    const otp = await createOTP(`reset:${email}`);
    await sendEmail({
      to: email,
      subject: 'Reset your PVI password',
      html: buildOTPEmail(user.fullName, otp),
    });
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(email: string, otp: string, newPassword: string) {
    const valid = await verifyOTP(`reset:${email}`, otp);
    if (!valid) {
      throw new AuthError('Invalid or expired reset code');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { email },
      data: { passwordHash, refreshToken: null },
    });
  }

  /**
   * Request 2FA — generate and send OTP
   */
  async request2FA(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    if (!user) throw new NotFoundError('User');

    const otp = await createOTP(`2fa:${user.email}`);
    await sendEmail({
      to: user.email,
      subject: 'PVI — Two-Factor Authentication Code',
      html: buildOTPEmail(user.fullName, otp),
    });
  }

  /**
   * Verify 2FA OTP
   */
  async verify2FA(userId: string, otp: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) throw new NotFoundError('User');

    const valid = await verifyOTP(`2fa:${user.email}`, otp);
    if (!valid) {
      throw new AuthError('Invalid 2FA code');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return true;
  }

  // ─── Token helpers ─────────────────────────────────

  private parseExpiry(value: string): number {
    const match = value.match(/^(\d+)(m|h|d)$/);
    if (!match) return 900; // default 15 minutes
    const num = parseInt(match[1]);
    switch (match[2]) {
      case 'm': return num * 60;
      case 'h': return num * 3600;
      case 'd': return num * 86400;
      default: return 900;
    }
  }

  private generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
      expiresIn: this.parseExpiry(env.JWT_ACCESS_EXPIRES_IN),
    });
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
      expiresIn: this.parseExpiry(env.JWT_REFRESH_EXPIRES_IN),
    });
  }
}

export const authService = new AuthService();
