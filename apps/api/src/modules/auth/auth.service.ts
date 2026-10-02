import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { RoleCode } from '@vj/shared';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { AuthRepository } from './auth.repository';
import { LoginDto, RegisterDto } from './dto/auth.dto';

function extractRolesPermissions(user: {
  roles: Array<{
    role: {
      code: string;
      permissions: Array<{ permission: { code: string } }>;
    };
  }>;
}) {
  const roles = user.roles.map((r) => r.role.code);
  const permissions = [
    ...new Set(user.roles.flatMap((r) => r.role.permissions.map((p) => p.permission.code))),
  ];
  return { roles, permissions };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.repo.findUserByEmail(dto.email);
    if (existing) {
      throw new AppException(ErrorCode.CONFLICT, 'Email already registered', HttpStatus.CONFLICT);
    }
    const customerRole = await this.repo.findRoleByCode(RoleCode.CUSTOMER);
    if (!customerRole) {
      throw new AppException(ErrorCode.INTERNAL_ERROR, 'Customer role missing', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.repo.createUser({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      roleId: customerRole.id,
    });
    return this.issueSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.repo.findUserByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    if (user.status !== 'ACTIVE') {
      throw new AppException(ErrorCode.FORBIDDEN, 'Account is not active', HttpStatus.FORBIDDEN);
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    await this.repo.touchLastLogin(user.id);
    return this.issueSession(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.repo.findRefreshToken(tokenHash);
    if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }
    await this.repo.revokeRefreshToken(stored.id);
    const user = await this.repo.findUserById(stored.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'User not found', HttpStatus.UNAUTHORIZED);
    }
    return this.issueSession(user);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.repo.findRefreshToken(tokenHash);
    if (stored && !stored.revokedAt) {
      await this.repo.revokeRefreshToken(stored.id);
    }
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new AppException(ErrorCode.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }
    const { roles, permissions } = extractRolesPermissions(user);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      permissions,
    };
  }

  private async issueSession(user: NonNullable<Awaited<ReturnType<AuthRepository['findUserById']>>>) {
    const { roles, permissions } = extractRolesPermissions(user);
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, roles, permissions },
      {
        secret: this.config.getOrThrow<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessTtl') ?? '15m',
      },
    );
    const refreshToken = randomBytes(48).toString('hex');
    const ttl = this.config.get<string>('jwt.refreshTtl') ?? '7d';
    const expiresAt = this.parseTtlToDate(ttl);
    await this.repo.saveRefreshToken(user.id, this.hashToken(refreshToken), expiresAt);
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: this.ttlToSeconds(this.config.get<string>('jwt.accessTtl') ?? '15m'),
      },
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseTtlToDate(ttl: string): Date {
    const seconds = this.ttlToSeconds(ttl);
    return new Date(Date.now() + seconds * 1000);
  }

  private ttlToSeconds(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 900;
    const n = parseInt(match[1]!, 10);
    const unit = match[2]!;
    switch (unit) {
      case 's':
        return n;
      case 'm':
        return n * 60;
      case 'h':
        return n * 3600;
      case 'd':
        return n * 86400;
      default:
        return 900;
    }
  }
}
