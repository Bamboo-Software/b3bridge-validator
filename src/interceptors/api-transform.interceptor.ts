import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IResponse<T> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
}

@Injectable()
export class ApiTransformInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T>> {
    if (context.getType() != 'http') {
      return next.handle();
    }
    return next.handle().pipe(
      map((data) => {
        const statusCode = context
          .switchToHttp()
          .getResponse().statusCode;
        return {
          success: true,
          statusCode,
          message: 'Success',
          data,
        };
      }),
      // catchError((err) => {
      //     const req = context.switchToHttp().getRequest();
      //     console.warn('[TransformInterceptor] err:', req.method, req.url, err);
      //     throw err;
      // }),
    );
  }
}