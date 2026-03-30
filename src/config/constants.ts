export const ROLE_HIERARCHY: Record<string, number> = {
  NATIONAL_ADMIN: 7,
  ZONAL_COORDINATOR: 6,
  STATE_COORDINATOR: 5,
  LGA_COORDINATOR: 4,
  WARD_LEADER: 3,
  POLLING_AGENT: 2,
  VOLUNTEER: 1,
  MEMBER: 0,
};

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
};

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_LENGTH = 6;

export const BCRYPT_ROUNDS = 12;

export const ENGAGEMENT_POINTS = {
  TASK_COMPLETED: 10,
  EVENT_ATTENDED: 15,
  MEMBER_RECRUITED: 20,
  ACTIVITY_UPLOADED: 5,
  MESSAGE_ACKNOWLEDGED: 2,
  FAST_ACKNOWLEDGEMENT_BONUS: 5, // within 1 hour
};

export const DONATION_TIERS = {
  BRONZE: { min: 1000, max: 10000 },
  SILVER: { min: 10001, max: 50000 },
  GOLD: { min: 50001, max: 250000 },
  PLATINUM: { min: 250001, max: Infinity },
};

export const FILE_UPLOAD = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
  ALLOWED_DOC_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
};
