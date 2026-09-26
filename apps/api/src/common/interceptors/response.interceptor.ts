import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { requestId?: string }>();
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in (data as object)) {
          return data;
        }
        const payload = data as { data?: unknown; meta?: Record<string, unknown> } | unknown;
        if (
          payload &&
          typeof payload === 'object' &&
          'data' in (payload as object) &&
          'meta' in (payload as object)
        ) {
          const p = payload as { data: unknown; meta: Record<string, unknown> };
          return {
            success: true,
            data: p.data,
            meta: {
              requestId: request.requestId ?? 'unknown',
              timestamp: new Date().toISOString(),
              ...p.meta,
            },
          };
        }
        return {
          success: true,
          data: data ?? null,
          meta: {
            requestId: request.requestId ?? 'unknown',
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
