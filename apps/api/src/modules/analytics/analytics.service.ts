import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(from?: Date, to?: Date) {
    const createdAt =
      from || to
        ? {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          }
        : undefined;

    const [tryOnSessions, captures, uniqueUsers, publishedProducts, byKind, topProducts] =
      await Promise.all([
        this.prisma.tryOnSession.count({
          where: { deletedAt: null, ...(createdAt ? { createdAt } : {}) },
        }),
        this.prisma.capturedImage.count({
          where: { deletedAt: null, ...(createdAt ? { createdAt } : {}) },
        }),
        this.prisma.tryOnSession.findMany({
          where: { deletedAt: null, userId: { not: null }, ...(createdAt ? { createdAt } : {}) },
          distinct: ['userId'],
          select: { userId: true },
        }),
        this.prisma.product.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
        this.prisma.tryOnSession.groupBy({
          by: ['jewelleryKind'],
          where: { deletedAt: null, ...(createdAt ? { createdAt } : {}) },
          _count: { _all: true },
        }),
        this.prisma.tryOnSession.groupBy({
          by: ['productId'],
          where: { deletedAt: null, ...(createdAt ? { createdAt } : {}) },
          _count: { _all: true },
          orderBy: { _count: { productId: 'desc' } },
          take: 10,
        }),
      ]);

    const productIds = topProducts.map((t) => t.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const nameById = Object.fromEntries(products.map((p) => [p.id, p.name]));

    return {
      range: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
      totals: {
        tryOnSessions,
        captures,
        uniqueUsers: uniqueUsers.length,
        publishedProducts,
      },
      byJewelleryKind: byKind.map((k) => ({
        jewelleryKind: k.jewelleryKind,
        sessions: k._count._all,
      })),
      topProducts: topProducts.map((t) => ({
        productId: t.productId,
        name: nameById[t.productId] ?? 'Unknown',
        sessions: t._count._all,
      })),
    };
  }
}
