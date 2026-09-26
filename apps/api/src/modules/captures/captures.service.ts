import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CaptureStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { STORAGE_PORT, StoragePort } from '../../infrastructure/storage/storage.port';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';

@Injectable()
export class CapturesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly config: ConfigService,
  ) {}

  async register(
    sessionId: string,
    input: {
      storageKey: string;
      width?: number;
      height?: number;
      mimeType: string;
      fileSizeBytes?: number;
    },
    userId?: string,
  ) {
    const session = await this.prisma.tryOnSession.findFirst({
      where: { id: sessionId, deletedAt: null },
    });
    if (!session) {
      throw new AppException(ErrorCode.SESSION_NOT_FOUND, 'Session not found', HttpStatus.NOT_FOUND);
    }
    const head = await this.storage.headObject(input.storageKey);
    if (!head.exists) {
      throw new AppException(ErrorCode.STORAGE_ERROR, 'Capture object missing', HttpStatus.BAD_REQUEST);
    }
    const ttlDays = this.config.get<number>('capturesDefaultTtlDays') ?? 30;
    const expiresAt = new Date(Date.now() + ttlDays * 86400_000);
    const url = this.storage.publicUrl(input.storageKey);
    const capture = await this.prisma.capturedImage.create({
      data: {
        sessionId,
        userId: userId ?? session.userId,
        productId: session.productId,
        storageKey: input.storageKey,
        url,
        width: input.width,
        height: input.height,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes ?? head.contentLength,
        status: CaptureStatus.READY,
        expiresAt,
      },
    });
    const downloadTtl = this.config.get<number>('storage.presignDownloadTtlSec') ?? 120;
    const downloadUrl = await this.storage.createPresignedDownload(
      capture.storageKey,
      downloadTtl,
      `tryon-${capture.id}.jpg`,
    );
    return {
      id: capture.id,
      status: capture.status,
      url: downloadUrl,
      thumbUrl: null,
      expiresAt: capture.expiresAt,
    };
  }

  async listMine(userId: string, page: number, pageSize: number) {
    const where = { userId, deletedAt: null, status: CaptureStatus.READY };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.capturedImage.count({ where }),
      this.prisma.capturedImage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { items, total };
  }

  async get(id: string, userId?: string, isAdmin = false) {
    const capture = await this.prisma.capturedImage.findFirst({
      where: { id, deletedAt: null },
    });
    if (!capture) throw new AppException(ErrorCode.NOT_FOUND, 'Capture not found', HttpStatus.NOT_FOUND);
    if (!isAdmin && capture.userId && userId && capture.userId !== userId) {
      throw new AppException(ErrorCode.FORBIDDEN, 'Forbidden', HttpStatus.FORBIDDEN);
    }
    if (capture.expiresAt && capture.expiresAt.getTime() < Date.now()) {
      throw new AppException(ErrorCode.CAPTURE_EXPIRED, 'Capture expired', HttpStatus.GONE);
    }
    return capture;
  }

  async download(id: string, userId?: string) {
    const capture = await this.get(id, userId);
    const ttl = this.config.get<number>('storage.presignDownloadTtlSec') ?? 120;
    const downloadUrl = await this.storage.createPresignedDownload(
      capture.storageKey,
      ttl,
      `tryon-${capture.id}.jpg`,
    );
    return { downloadUrl, fileName: `tryon-${capture.id}.jpg`, expiresIn: ttl };
  }

  async softDelete(id: string, userId: string) {
    const capture = await this.get(id, userId);
    return this.prisma.capturedImage.update({
      where: { id: capture.id },
      data: { deletedAt: new Date(), status: CaptureStatus.DELETED },
    });
  }
}
