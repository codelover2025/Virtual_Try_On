import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';
import { TryOnSessionStatus } from '@vj/shared';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { TryOnService } from './try-on.service';

class StartSessionDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  clientInfo?: Record<string, unknown>;
}

class PatchSessionDto {
  @ApiPropertyOptional({ enum: TryOnSessionStatus })
  @IsOptional()
  @IsEnum(TryOnSessionStatus)
  status?: (typeof TryOnSessionStatus)[keyof typeof TryOnSessionStatus];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metrics?: Record<string, unknown>;
}

@ApiTags('try-on')
@Controller('try-on')
export class TryOnController {
  constructor(private readonly tryOn: TryOnService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('sessions')
  start(@Body() dto: StartSessionDto, @CurrentUser() user?: JwtPayloadUser) {
    return this.tryOn.start(dto.productId, user?.id, dto.clientInfo);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Patch('sessions/:sessionId')
  patch(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: PatchSessionDto,
    @CurrentUser() user?: JwtPayloadUser,
  ) {
    return this.tryOn.patch(sessionId, dto, user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('sessions/:sessionId')
  get(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.tryOn.get(sessionId);
  }
}
