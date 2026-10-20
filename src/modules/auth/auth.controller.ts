import {
  BadRequestException,
  Body,
  Controller,
  ParseIntPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CustomValidationPipe } from '../../common/pipe/validation.pipe.js';
import { registerSchema } from './auth.validation.js';
import { LoggingInterceptor } from '../../logging/logging.interceptor.js';

@Controller('auth')
@UseInterceptors(LoggingInterceptor)

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/:id')
  register(
    @Body(
      'age',
      new ParseIntPipe({
        errorHttpStatusCode: 400,
        exceptionFactory: (error) => {
          throw new BadRequestException({
            message: 'Age must be int',
            cause: {
              extra: error,
            },
          });
        },
      }),
    )
    age: any,
    @Body(new CustomValidationPipe(registerSchema))
    body: any,
    // @Param() params: { id: string },
    // @Query() query: { page: string },
    // @Req() req: Request,
  ) {
    const result = this.authService.register(body);    
    return result;
  }
}
