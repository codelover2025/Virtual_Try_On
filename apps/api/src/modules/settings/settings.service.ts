import { Injectable } from '@nestjs/common';
import { Prisma, SettingValueType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  async publicSettings() {
    const cached = await this.redis.get('settings:public');
    if (cached) return JSON.parse(cached);
    const rows = await this.prisma.setting.findMany({
      where: { deletedAt: null, isPublic: true },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    await this.redis.set('settings:public', JSON.stringify(map), 60);
    return map;
  }

  adminList() {
    return this.prisma.setting.findMany({ where: { deletedAt: null }, orderBy: { key: 'asc' } });
  }

  async upsert(
    key: string,
    input: {
      value: unknown;
      valueType: SettingValueType;
      description?: string;
      isPublic?: boolean;
    },
    actorId: string,
  ) {
    const row = await this.prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value: input.value as Prisma.InputJsonValue,
        valueType: input.valueType,
        description: input.description,
        isPublic: input.isPublic ?? false,
        updatedById: actorId,
      },
      update: {
        value: input.value as Prisma.InputJsonValue,
        valueType: input.valueType,
        description: input.description,
        isPublic: input.isPublic,
        updatedById: actorId,
        deletedAt: null,
      },
    });
    await this.redis.del('settings:public');
    await this.audit.record({
      actorUserId: actorId,
      action: 'SETTING_UPSERT',
      entityType: 'Setting',
      entityId: row.id,
      after: row,
    });
    return row;
  }
}
