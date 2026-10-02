import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionCode } from '@vj/shared';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('admin-analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
@UseGuards(PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  @Permissions(PermissionCode.ANALYTICS_READ)
  overview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.overview(from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }
}
