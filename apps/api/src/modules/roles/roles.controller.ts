import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionCode } from '@vj/shared';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@ApiTags('admin-roles')
@ApiBearerAuth()
@Controller('admin/roles')
@UseGuards(PermissionsGuard)
export class RolesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions(PermissionCode.USERS_READ)
  async list() {
    return this.prisma.role.findMany({
      where: { deletedAt: null },
      include: { permissions: { include: { permission: true } } },
      orderBy: { code: 'asc' },
    });
  }
}
