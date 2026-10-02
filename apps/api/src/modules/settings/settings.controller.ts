import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PermissionCode, SettingValueType } from '@vj/shared';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser, JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

class UpsertSettingDto {
  @ApiProperty()
  value!: unknown;

  @ApiProperty({ enum: SettingValueType })
  @IsEnum(SettingValueType)
  valueType!: (typeof SettingValueType)[keyof typeof SettingValueType];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

@ApiTags('settings')
@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Public()
  @Get('settings/public')
  publicSettings() {
    return this.settings.publicSettings();
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Get('admin/settings')
  @Permissions(PermissionCode.SETTINGS_WRITE)
  adminList() {
    return this.settings.adminList();
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Put('admin/settings/:key')
  @Permissions(PermissionCode.SETTINGS_WRITE)
  upsert(
    @Param('key') key: string,
    @Body() dto: UpsertSettingDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.settings.upsert(key, dto, user.id);
  }
}
