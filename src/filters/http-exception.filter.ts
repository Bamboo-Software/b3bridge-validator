import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(ex: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = ex.getStatus();

    const exceptionResponse = ex.getResponse();
    let message = ex.message;

    if (typeof exceptionResponse === 'object') {
      message = (exceptionResponse as any).message || message;
    }

    this.logger.error(ex, ex.stack);
    response.status(status).json({
      success: false,
      statusCode: status,
      error: ex.name,
      message: message || `Cannot ${request.method} ${request.url}`,
    });
  }
}
