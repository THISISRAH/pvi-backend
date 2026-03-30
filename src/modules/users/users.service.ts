import prisma from '../../config/database';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { AuthUser } from '../../middleware/auth';
import { buildJurisdictionFilter } from '../../middleware/jurisdiction';
import { createAuditLog } from '../../services/auditLog';
import { encrypt, decrypt } from '../../services/encryption';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { isHigherRole } from '../../middleware/rbac';
import { UpdateUserInput, UserQueryInput } from './users.validators';

const userSelectFields = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
  gender: true,
  dateOfBirth: true,
  profilePhotoUrl: true,
  occupation: true,

  role: true,
  status: true,
  hasPvc: true,
  pvcVerified: true,
  engagementScore: true,
  zoneId: true,
  stateId: true,
  lgaId: true,
  wardId: true,
  pollingUnitId: true,
  lastLoginAt: true,
  createdAt: true,
  zone: { select: { name: true } },
  state: { select: { name: true } },
  lga: { select: { name: true } },
  ward: { select: { name: true } },
  pollingUnit: { select: { name: true } },
};

export class UsersService {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelectFields,
    });
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async updateMe(userId: string, data: UpdateUserInput) {
    const updateData: any = { ...data };
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }
    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: userSelectFields,
    });
  }

  async getUsers(authUser: AuthUser, query: UserQueryInput) {
    const jurisdictionFilter = buildJurisdictionFilter(authUser);

    const where: Prisma.UserWhereInput = {
      ...jurisdictionFilter,
      ...(query.role && { role: query.role }),
      ...(query.status && { status: query.status }),
      ...(query.gender && { gender: query.gender }),
      ...(query.hasPvc !== undefined && { hasPvc: query.hasPvc }),
      ...(query.stateId && { stateId: query.stateId }),
      ...(query.lgaId && { lgaId: query.lgaId }),
      ...(query.wardId && { wardId: query.wardId }),
      ...(query.search && {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { phone: { contains: query.search } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelectFields,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sort]: query.order },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelectFields,
    });
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async updateUser(adminUser: AuthUser, targetId: string, data: UpdateUserInput) {
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { role: true },
    });
    if (!target) throw new NotFoundError('User');

    if (!isHigherRole(adminUser.role, target.role)) {
      throw new ForbiddenError('You can only manage users below your role level');
    }

    const updateData: any = { ...data };
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);

    return prisma.user.update({
      where: { id: targetId },
      data: updateData,
      select: userSelectFields,
    });
  }

  async updateUserStatus(adminUser: AuthUser, targetId: string, status: UserStatus, ipAddress?: string, userAgent?: string) {
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { role: true },
    });
    if (!target) throw new NotFoundError('User');

    if (!isHigherRole(adminUser.role, target.role)) {
      throw new ForbiddenError('You can only manage users below your role level');
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { status },
      select: userSelectFields,
    });

    await createAuditLog({
      userId: adminUser.id,
      action: 'UPDATE',
      resourceType: 'user',
      resourceId: targetId,
      ipAddress,
      userAgent,
      metadata: { field: 'status', newValue: status },
    });

    return updated;
  }

  async updateUserRole(adminUser: AuthUser, targetId: string, role: UserRole, ipAddress?: string, userAgent?: string) {
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { role: true },
    });
    if (!target) throw new NotFoundError('User');

    if (!isHigherRole(adminUser.role, target.role)) {
      throw new ForbiddenError('You can only manage users below your role level');
    }

    if (!isHigherRole(adminUser.role, role)) {
      throw new ForbiddenError('You cannot assign a role equal to or above your own');
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: userSelectFields,
    });

    await createAuditLog({
      userId: adminUser.id,
      action: 'ROLE_CHANGE',
      resourceType: 'user',
      resourceId: targetId,
      ipAddress,
      userAgent,
      metadata: { oldRole: target.role, newRole: role },
    });

    return updated;
  }

  async softDeleteUser(adminUser: AuthUser, targetId: string, ipAddress?: string, userAgent?: string) {
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { role: true },
    });
    if (!target) throw new NotFoundError('User');

    if (!isHigherRole(adminUser.role, target.role)) {
      throw new ForbiddenError('You can only manage users below your role level');
    }

    await prisma.user.update({
      where: { id: targetId },
      data: { status: 'INACTIVE' },
    });

    await createAuditLog({
      userId: adminUser.id,
      action: 'DELETE',
      resourceType: 'user',
      resourceId: targetId,
      ipAddress,
      userAgent,
    });
  }

  async getLeaderboard(authUser: AuthUser, limit: number = 20) {
    const jurisdictionFilter = buildJurisdictionFilter(authUser);

    return prisma.user.findMany({
      where: {
        ...jurisdictionFilter,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        profilePhotoUrl: true,
        role: true,
        engagementScore: true,
        state: { select: { name: true } },
        lga: { select: { name: true } },
        ward: { select: { name: true } },
      },
      orderBy: { engagementScore: 'desc' },
      take: limit,
    });
  }
}

export const usersService = new UsersService();
