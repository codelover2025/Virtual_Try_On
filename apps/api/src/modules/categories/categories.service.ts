import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AuditService } from '../audit/audit.service';

type Cat = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

@Injectable()
export class CategoriesService {
  constructor(
    private readonly repo: CategoriesRepository,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  async publicTree() {
    const cached = await this.redis.get('categories:tree');
    if (cached) return JSON.parse(cached) as unknown;
    const rows = await this.repo.findAllActive();
    const tree = this.buildTree(rows);
    await this.redis.set('categories:tree', JSON.stringify(tree), 300);
    return tree;
  }

  async adminList() {
    return this.repo.findAllAdmin();
  }

  async get(idOrSlug: string) {
    const cat = await this.repo.findByIdOrSlug(idOrSlug);
    if (!cat) throw new AppException(ErrorCode.CATEGORY_NOT_FOUND, 'Category not found', HttpStatus.NOT_FOUND);
    return cat;
  }

  async create(dto: CreateCategoryDto, actorId: string) {
    const created = await this.repo.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
    });
    await this.redis.del('categories:tree');
    await this.audit.record({
      actorUserId: actorId,
      action: 'CATEGORY_CREATE',
      entityType: 'Category',
      entityId: created.id,
      after: created,
    });
    return created;
  }

  async update(id: string, dto: UpdateCategoryDto, actorId: string) {
    const before = await this.repo.findByIdOrSlug(id);
    if (!before) throw new AppException(ErrorCode.CATEGORY_NOT_FOUND, 'Category not found', HttpStatus.NOT_FOUND);
    const updated = await this.repo.update(id, {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
      parent: dto.parentId === undefined
        ? undefined
        : dto.parentId
          ? { connect: { id: dto.parentId } }
          : { disconnect: true },
    });
    await this.redis.del('categories:tree');
    await this.audit.record({
      actorUserId: actorId,
      action: 'CATEGORY_UPDATE',
      entityType: 'Category',
      entityId: id,
      before,
      after: updated,
    });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const before = await this.repo.findByIdOrSlug(id);
    if (!before) throw new AppException(ErrorCode.CATEGORY_NOT_FOUND, 'Category not found', HttpStatus.NOT_FOUND);
    const deleted = await this.repo.softDelete(id);
    await this.redis.del('categories:tree');
    await this.audit.record({
      actorUserId: actorId,
      action: 'CATEGORY_DELETE',
      entityType: 'Category',
      entityId: id,
      before,
    });
    return deleted;
  }

  private buildTree(rows: Cat[]) {
    const map = new Map<string, Cat & { children: Cat[] }>();
    rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
    const roots: Array<Cat & { children: Cat[] }> = [];
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }
}
