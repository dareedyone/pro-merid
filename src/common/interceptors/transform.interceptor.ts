import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(({ message, ...data }) => ({
        success: true,
        statusCode: context.switchToHttp().getResponse<Response>().statusCode,
        message: message || 'Request successful',
        data,
        // meta: data.meta || null,
      })),
    );
  }
}
