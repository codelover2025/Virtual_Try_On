import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { AssetType, PermissionCode } from '@vj/shared';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser, JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { JewelleryAssetsService } from './jewellery-assets.service';

class CreateAssetDto {
  @ApiProperty({ enum: AssetType })
  @IsEnum(AssetType)
  assetType!: (typeof AssetType)[keyof typeof AssetType];

  @ApiProperty()
  @IsString()
  storageKey!: string;

  @ApiProperty()
  @IsString()
  url!: string;

  @ApiProperty()
  @IsObject()
  anchorProfile!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  defaultScale?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  defaultRotationZ?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mirrorForOppositeEar?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  fingerIndex?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('admin-assets')
@ApiBearerAuth()
@Controller('admin/products/:productId/assets')
@UseGuards(PermissionsGuard)
export class JewelleryAssetsController {
  constructor(private readonly assets: JewelleryAssetsService) {}

  @Get()
  @Permissions(PermissionCode.ASSETS_WRITE)
  list(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.assets.list(productId);
  }

  @Post()
  @Permissions(PermissionCode.ASSETS_WRITE)
  create(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateAssetDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.assets.create(productId, dto, user.id);
  }

  @Post(':assetId/activate')
  @Permissions(PermissionCode.ASSETS_WRITE)
  activate(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.assets.activate(productId, assetId, user.id);
  }
}
