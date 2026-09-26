import { Global, Module } from '@nestjs/common';
import { S3StorageAdapter } from './s3.storage';
import { STORAGE_PORT } from './storage.port';

@Global()
@Module({
  providers: [
    S3StorageAdapter,
    {
      provide: STORAGE_PORT,
      useExisting: S3StorageAdapter,
    },
  ],
  exports: [STORAGE_PORT, S3StorageAdapter],
})
export class StorageModule {}
