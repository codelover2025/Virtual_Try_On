import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, TryOnSessionStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';

@Injectable()
export class TryOnService {
  constructor(private readonly prisma: PrismaService) {}

  async start(productId: string, userId: string | undefined, clientInfo?: Record<string, unknown>) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null, status: 'PUBLISHED' },
      include: {
        jewelleryAssets: { where: { deletedAt: null, isActive: true }, take: 1 },
      },
    });
    if (!product) {
      throw new AppException(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    const asset = product.jewelleryAssets[0];
    if (!asset) {
      throw new AppException(ErrorCode.ASSET_INACTIVE, 'No active try-on asset', HttpStatus.CONFLICT);
    }
    const session = await this.prisma.tryOnSession.create({
      data: {
        productId,
        userId: userId ?? null,
        jewelleryKind: product.jewelleryKind,
        clientInfo: (clientInfo as Prisma.InputJsonValue) ?? undefined,
      },
    });
    return {
      sessionId: session.id,
      productId: product.id,
      jewelleryKind: product.jewelleryKind,
      status: session.status,
      asset: {
        id: asset.id,
        assetType: asset.assetType,
        url: asset.url,
        anchorProfile: asset.anchorProfile,
        defaultScale: asset.defaultScale,
        defaultRotationZ: asset.defaultRotationZ,
        mirrorForOppositeEar: asset.mirrorForOppositeEar,
        fingerIndex: asset.fingerIndex,
      },
    };
  }

  async patch(
    sessionId: string,
    data: { status?: TryOnSessionStatus; metrics?: Record<string, unknown> },
    userId?: string,
  ) {
    const session = await this.prisma.tryOnSession.findFirst({
      where: { id: sessionId, deletedAt: null },
    });
    if (!session) {
      throw new AppException(ErrorCode.SESSION_NOT_FOUND, 'Session not found', HttpStatus.NOT_FOUND);
    }
    if (session.userId && userId && session.userId !== userId) {
      throw new AppException(ErrorCode.FORBIDDEN, 'Not your session', HttpStatus.FORBIDDEN);
    }
    return this.prisma.tryOnSession.update({
      where: { id: sessionId },
      data: {
        status: data.status,
        metrics: (data.metrics as Prisma.InputJsonValue) ?? undefined,
        endedAt:
          data.status && data.status !== TryOnSessionStatus.ACTIVE ? new Date() : undefined,
      },
    });
  }

  async get(sessionId: string) {
    const session = await this.prisma.tryOnSession.findFirst({
      where: { id: sessionId, deletedAt: null },
      include: { product: true },
    });
    if (!session) {
      throw new AppException(ErrorCode.SESSION_NOT_FOUND, 'Session not found', HttpStatus.NOT_FOUND);
    }
    return session;
  }
}
