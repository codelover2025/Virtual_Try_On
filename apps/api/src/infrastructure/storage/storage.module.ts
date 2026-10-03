import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageAdapter } from './local.storage';
import { S3StorageAdapter } from './s3.storage';
import { STORAGE_PORT, StoragePort } from './storage.port';

@Global()
@Module({
  providers: [
    S3StorageAdapter,
    LocalStorageAdapter,
    {
      provide: STORAGE_PORT,
      inject: [ConfigService, S3StorageAdapter, LocalStorageAdapter],
      useFactory: (
        config: ConfigService,
        s3: S3StorageAdapter,
        local: LocalStorageAdapter,
      ): StoragePort => {
        const provider = config.get<string>('storage.provider') ?? 'local';
        return provider === 'local' ? local : s3;
      },
    },
  ],
  exports: [STORAGE_PORT, S3StorageAdapter, LocalStorageAdapter],
})
export class StorageModule {}
