/*
https://docs.nestjs.com/exception-filters#custom-exceptions
*/

import {HttpException, HttpStatus} from '@nestjs/common';

export class TokenInvalidException extends HttpException {
  constructor() {
    super('Token Invalid', HttpStatus.BAD_REQUEST);
  }
}
