import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { paginationMeta } from '../../common/dto/pagination.dto';
import { CapturesService } from './captures.service';

class RegisterCaptureDto {
  @ApiProperty()
  @IsString()
  storageKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  height?: number;

  @ApiProperty()
  @IsString()
  mimeType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fileSizeBytes?: number;
}

@ApiTags('captures')
@Controller('try-on')
export class CapturesController {
  constructor(private readonly captures: CapturesService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('sessions/:sessionId/captures')
  register(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: RegisterCaptureDto,
    @CurrentUser() user?: JwtPayloadUser,
  ) {
    return this.captures.register(sessionId, dto, user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('captures')
  async mine(
    @CurrentUser() user: JwtPayloadUser,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
    const { items, total } = await this.captures.listMine(user.id, p, ps);
    return { data: items, meta: { pagination: paginationMeta(p, ps, total) } };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('captures/:captureId')
  get(@Param('captureId', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayloadUser) {
    return this.captures.get(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('captures/:captureId/download')
  download(@Param('captureId', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayloadUser) {
    return this.captures.download(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('captures/:captureId')
  remove(@Param('captureId', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayloadUser) {
    return this.captures.softDelete(id, user.id);
  }
}
