import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    console.log(`[${req.method}] ${req.url} - Start`);

    return next.handle().pipe(
      tap(() => {
        console.log(
          `[${req.method}] ${req.url} - Done in ${Date.now() - now}ms`,
        );
      }),
    );
  }
}
