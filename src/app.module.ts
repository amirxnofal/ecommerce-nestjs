import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [AuthModule],
})
export class AppModule {}
