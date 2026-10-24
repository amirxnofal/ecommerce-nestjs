import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service.js';
import { SuccessResponseInterceptor } from './logging/logging.interceptor.js';

@Controller()
@UseInterceptors(SuccessResponseInterceptor)

export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  healthCheck(): object {
    return this.appService.healthCheck();
  }
}
