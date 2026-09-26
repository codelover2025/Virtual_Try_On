import { Injectable } from '@nestjs/common';
import { JewelleryKind, Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private listInclude = {
    category: true,
    images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' as const } },
  };

  async findPublishedPage(params: {
    page: number;
    pageSize: number;
    categoryId?: string;
    jewelleryKind?: JewelleryKind;
    q?: string;
  }) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: ProductStatus.PUBLISHED,
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.jewelleryKind ? { jewelleryKind: params.jewelleryKind } : {}),
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q, mode: 'insensitive' } },
              { sku: { contains: params.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    return this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: this.listInclude,
        orderBy: { publishedAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);
  }

  findByIdOrSlug(idOrSlug: string, publishedOnly = false) {
    return this.prisma.product.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(publishedOnly ? { status: ProductStatus.PUBLISHED } : {}),
      },
      include: {
        category: true,
        images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        jewelleryAssets: { where: { deletedAt: null, isActive: true }, take: 1 },
      },
    });
  }

  create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data, include: this.listInclude });
  }

  update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({ where: { id }, data, include: this.listInclude });
  }

  softDelete(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        slug: `deleted-${id}-${Date.now()}`,
        sku: `deleted-${id}-${Date.now()}`,
        status: ProductStatus.ARCHIVED,
      },
    });
  }
}
