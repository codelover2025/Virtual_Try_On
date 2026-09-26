import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { JewelleryKind, PermissionCode } from '@vj/shared';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser, JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { paginationMeta } from '../../common/dto/pagination.dto';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ProductListQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: JewelleryKind })
  @IsOptional()
  @IsEnum(JewelleryKind)
  jewelleryKind?: (typeof JewelleryKind)[keyof typeof JewelleryKind];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

@ApiTags('products')
@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Public()
  @Get('products')
  async list(@Query() query: ProductListQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { items, total } = await this.products.listPublic({
      page,
      pageSize,
      categoryId: query.categoryId,
      jewelleryKind: query.jewelleryKind,
      q: query.q,
    });
    return { data: items, meta: { pagination: paginationMeta(page, pageSize, total) } };
  }

  @Public()
  @Get('products/:idOrSlug')
  detail(@Param('idOrSlug') idOrSlug: string) {
    return this.products.detailPublic(idOrSlug);
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Post('admin/products')
  @Permissions(PermissionCode.PRODUCTS_WRITE)
  create(@Body() dto: CreateProductDto, @CurrentUser() user: JwtPayloadUser) {
    return this.products.create(dto, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Patch('admin/products/:id')
  @Permissions(PermissionCode.PRODUCTS_WRITE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.products.update(id, dto, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Post('admin/products/:id/publish')
  @Permissions(PermissionCode.PRODUCTS_PUBLISH)
  publish(@Param('id') id: string, @CurrentUser() user: JwtPayloadUser) {
    return this.products.publish(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Delete('admin/products/:id')
  @Permissions(PermissionCode.PRODUCTS_WRITE)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayloadUser) {
    return this.products.remove(id, user.id);
  }
}
