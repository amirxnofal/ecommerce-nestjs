import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module.js';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      envFilePath: ['.env.dev', '.env.prod'],
      isGlobal: true,
    }),
    UserModule,
  ],
})
export class AppModule {}
