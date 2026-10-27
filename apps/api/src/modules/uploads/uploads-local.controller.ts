import {
  Controller,
  Get,
  HttpStatus,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { LocalStorageAdapter } from '../../infrastructure/storage/local.storage';

@ApiTags('uploads-local')
@Controller('uploads')
export class UploadsLocalController {
  constructor(private readonly local: LocalStorageAdapter) {}

  @Public()
  @Put('local')
  async putLocal(
    @Query('key') key: string,
    @Query('expires') expiresRaw: string,
    @Query('token') token: string,
    @Req() req: Request,
  ) {
    const expires = parseInt(expiresRaw, 10);
    if (!key || !token || !this.local.verifyToken(key, expires, token)) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Invalid upload token', HttpStatus.UNAUTHORIZED);
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    await this.local.writeObject(key, Buffer.concat(chunks));
    return { ok: true, storageKey: key };
  }

  @Public()
  @Get('files')
  async getFile(
    @Query('key') key: string,
    @Query('expires') expiresRaw: string | undefined,
    @Query('token') token: string | undefined,
    @Query('filename') filename: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!key) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'key required', HttpStatus.BAD_REQUEST);
    }
    if (expiresRaw && token) {
      const expires = parseInt(expiresRaw, 10);
      if (!this.local.verifyToken(key, expires, token)) {
        throw new AppException(ErrorCode.UNAUTHORIZED, 'Invalid download token', HttpStatus.UNAUTHORIZED);
      }
    }
    const head = await this.local.headObject(key);
    if (!head.exists) {
      throw new AppException(ErrorCode.NOT_FOUND, 'File not found', HttpStatus.NOT_FOUND);
    }
    if (filename) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`);
    }
    return new StreamableFile(this.local.openReadStream(key));
  }
}
