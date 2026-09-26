import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { JwtPayloadUser } from '../decorators/current-user.decorator';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../constants/error-codes';
import { RoleCode } from '@vj/shared';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
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
    if (user.roles.includes(RoleCode.SUPER_ADMIN)) {
      return true;
    }
    const ok = required.every((perm) => user.permissions.includes(perm));
    if (!ok) {
      throw new AppException(ErrorCode.FORBIDDEN, 'Insufficient permission', HttpStatus.FORBIDDEN);
    }
    return true;
  }
}
