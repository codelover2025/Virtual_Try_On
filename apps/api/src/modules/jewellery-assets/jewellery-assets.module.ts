import { Module } from '@nestjs/common';
import { JewelleryAssetsController } from './jewellery-assets.controller';
import { JewelleryAssetsService } from './jewellery-assets.service';

@Module({
  controllers: [JewelleryAssetsController],
  providers: [JewelleryAssetsService],
  exports: [JewelleryAssetsService],
})
export class JewelleryAssetsModule {}
