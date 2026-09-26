import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionCode } from '@vj/shared';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser, JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('categories')
@Controller()
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get('categories')
  publicTree() {
    return this.categories.publicTree();
  }

  @Public()
  @Get('categories/:idOrSlug')
  get(@Param('idOrSlug') idOrSlug: string) {
    return this.categories.get(idOrSlug);
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Get('admin/categories')
  @Permissions(PermissionCode.CATEGORIES_WRITE)
  adminList() {
    return this.categories.adminList();
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Post('admin/categories')
  @Permissions(PermissionCode.CATEGORIES_WRITE)
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: JwtPayloadUser) {
    return this.categories.create(dto, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Patch('admin/categories/:id')
  @Permissions(PermissionCode.CATEGORIES_WRITE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.categories.update(id, dto, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Delete('admin/categories/:id')
  @Permissions(PermissionCode.CATEGORIES_WRITE)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayloadUser) {
    return this.categories.remove(id, user.id);
  }
}
