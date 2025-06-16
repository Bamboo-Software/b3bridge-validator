import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class UnknownExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnknownExceptionFilter.name);

  catch(err: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    // const req = ctx.getRequest<Request>();
    const status = 500;
    this.logger.error(err, err.stack);
    res.status(status).json({
      success: false,
      statusCode: status,
      error: err.name,  
      message: err.message || 'Internal server error'
    });
  }
}
