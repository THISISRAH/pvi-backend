import crypto from 'crypto';
import cache from '../config/redis';
import { OTP_EXPIRY_MINUTES, OTP_LENGTH } from '../config/constants';

/**
 * Generate a random numeric OTP.
 */
function generateOTP(): string {
  const max = Math.pow(10, OTP_LENGTH);
  const min = Math.pow(10, OTP_LENGTH - 1);
  return crypto.randomInt(min, max).toString();
}

/**
 * Create and store an OTP for a given key (email or phone).
 */
export async function createOTP(key: string): Promise<string> {
  const otp = generateOTP();
  const redisKey = `otp:${key}`;
  await cache.set(redisKey, otp, 'EX', OTP_EXPIRY_MINUTES * 60);
  return otp;
}

/**
 * Verify an OTP against the stored value.
 */
export async function verifyOTP(key: string, otp: string): Promise<boolean> {
  const redisKey = `otp:${key}`;
  const stored = await cache.get(redisKey);
  
  if (!stored || stored !== otp) {
    return false;
  }

  // Delete OTP after successful verification (one-time use)
  await cache.del(redisKey);
  return true;
}
