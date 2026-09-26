import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayloadUser } from '../decorators/current-user.decorator';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../constants/error-codes';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user?: JwtPayloadUser }>();
    const user = request.user;
    if (!user) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const ok = required.some((role) => user.roles.includes(role));
    if (!ok) {
      throw new AppException(ErrorCode.FORBIDDEN, 'Insufficient role', HttpStatus.FORBIDDEN);
    }
    return true;
  }
}
