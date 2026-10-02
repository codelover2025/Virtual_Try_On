import { HttpStatus, Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UsersRepository } from './users.repository';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(page: number, pageSize: number, q?: string) {
    const [total, users] = await this.repo.findMany(page, pageSize, q);
    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        status: u.status,
        roles: u.roles.map((r) => r.role.code),
        createdAt: u.createdAt,
      })),
      total,
    };
  }

  async get(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new AppException(ErrorCode.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: user.roles.map((r) => r.role.code),
      createdAt: user.createdAt,
    };
  }

  async update(id: string, data: { fullName?: string; status?: UserStatus }, actorId: string) {
    const before = await this.repo.findById(id);
    if (!before) throw new AppException(ErrorCode.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    const updated = await this.repo.update(id, data);
    await this.audit.record({
      actorUserId: actorId,
      action: 'USER_UPDATE',
      entityType: 'User',
      entityId: id,
      before,
      after: updated,
    });
    return this.get(id);
  }

  async setRoles(userId: string, roleCodes: string[], actorId: string) {
    const roles = await this.prisma.role.findMany({
      where: { code: { in: roleCodes }, deletedAt: null },
    });
    if (roles.length !== roleCodes.length) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'One or more roles invalid', HttpStatus.BAD_REQUEST);
    }
    const before = await this.repo.findById(userId);
    if (!before) throw new AppException(ErrorCode.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    await this.repo.replaceRoles(userId, roles.map((r) => r.id), actorId);
    await this.audit.record({
      actorUserId: actorId,
      action: 'USER_ROLES_SET',
      entityType: 'User',
      entityId: userId,
      before: before.roles.map((r) => r.role.code),
      after: roleCodes,
    });
    return this.get(userId);
  }
}
