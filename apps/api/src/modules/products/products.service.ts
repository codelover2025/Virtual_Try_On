import { HttpStatus, Injectable } from '@nestjs/common';
import { ProductStatus, Prisma } from '@prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { ProductsRepository } from './products.repository';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AuditService } from '../audit/audit.service';
import { JewelleryKind } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private readonly repo: ProductsRepository,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  private mapListItem(p: Awaited<ReturnType<ProductsRepository['findByIdOrSlug']>>) {
    if (!p) return null;
    const primary = p.images.find((i) => i.isPrimary) ?? p.images[0] ?? null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      jewelleryKind: p.jewelleryKind,
      status: p.status,
      category: { id: p.category.id, name: p.category.name, slug: p.category.slug },
      primaryImage: primary
        ? { id: primary.id, url: primary.url, altText: primary.altText, sortOrder: primary.sortOrder, isPrimary: primary.isPrimary }
        : null,
      priceCents: p.priceCents,
      currency: p.currency,
    };
  }

  async listPublic(params: {
    page: number;
    pageSize: number;
    categoryId?: string;
    jewelleryKind?: JewelleryKind;
    q?: string;
  }) {
    const [total, rows] = await this.repo.findPublishedPage(params);
    return {
      items: rows.map((r) => this.mapListItem(r as never)!),
      total,
    };
  }

  async detailPublic(idOrSlug: string) {
    const cacheKey = `product:slug:${idOrSlug}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const p = await this.repo.findByIdOrSlug(idOrSlug, true);
    if (!p) throw new AppException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    const asset = p.jewelleryAssets[0] ?? null;
    const detail = {
      ...this.mapListItem(p)!,
      description: p.description,
      images: p.images.map((i) => ({
        id: i.id,
        url: i.url,
        altText: i.altText,
        sortOrder: i.sortOrder,
        isPrimary: i.isPrimary,
      })),
      tryOnAsset: asset
        ? {
            id: asset.id,
            assetType: asset.assetType,
            url: asset.url,
            anchorProfile: asset.anchorProfile,
            defaultScale: asset.defaultScale,
            defaultRotationZ: asset.defaultRotationZ,
            mirrorForOppositeEar: asset.mirrorForOppositeEar,
            fingerIndex: asset.fingerIndex,
            isActive: asset.isActive,
          }
        : null,
      metadata: p.metadata,
    };
    await this.redis.set(cacheKey, JSON.stringify(detail), 120);
    return detail;
  }

  async create(dto: CreateProductDto, actorId: string) {
    const created = await this.repo.create({
      category: { connect: { id: dto.categoryId } },
      sku: dto.sku,
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      jewelleryKind: dto.jewelleryKind,
      status: dto.status ?? ProductStatus.DRAFT,
      priceCents: dto.priceCents,
      currency: dto.currency,
      metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
      createdBy: { connect: { id: actorId } },
      updatedBy: { connect: { id: actorId } },
    });
    await this.audit.record({
      actorUserId: actorId,
      action: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: created.id,
      after: created,
    });
    return created;
  }

  async update(id: string, dto: UpdateProductDto, actorId: string) {
    const before = await this.repo.findByIdOrSlug(id);
    if (!before) throw new AppException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    const updated = await this.repo.update(id, {
      ...(dto.categoryId ? { category: { connect: { id: dto.categoryId } } } : {}),
      sku: dto.sku,
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      jewelleryKind: dto.jewelleryKind,
      status: dto.status,
      priceCents: dto.priceCents,
      currency: dto.currency,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      updatedBy: { connect: { id: actorId } },
    });
    await this.redis.del(`product:slug:${before.slug}`);
    await this.redis.delByPrefix('products:list:');
    await this.audit.record({
      actorUserId: actorId,
      action: 'PRODUCT_UPDATE',
      entityType: 'Product',
      entityId: id,
      before,
      after: updated,
    });
    return updated;
  }

  async publish(id: string, actorId: string) {
    const before = await this.repo.findByIdOrSlug(id);
    if (!before) throw new AppException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    const updated = await this.repo.update(id, {
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
      updatedBy: { connect: { id: actorId } },
    });
    await this.redis.del(`product:slug:${before.slug}`);
    await this.audit.record({
      actorUserId: actorId,
      action: 'PRODUCT_PUBLISH',
      entityType: 'Product',
      entityId: id,
      before,
      after: updated,
    });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const before = await this.repo.findByIdOrSlug(id);
    if (!before) throw new AppException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    const deleted = await this.repo.softDelete(id);
    await this.redis.del(`product:slug:${before.slug}`);
    await this.audit.record({
      actorUserId: actorId,
      action: 'PRODUCT_DELETE',
      entityType: 'Product',
      entityId: id,
      before,
    });
    return deleted;
  }
}
