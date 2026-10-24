import { Module } from '@nestjs/common';
import { UserModel } from '../../database/model/user.model.js';
import { UsersController } from './user.controller.js';
import { UsersService } from './user.service.js';
import { SecurityModule } from '../../common/services/security/security.module.js';
import { RedisModule } from '../../common/services/redis/redis.module.js';
import { TokenModule } from '../../common/services/token/token.module.js';

@Module({
	imports: [UserModel, TokenModule, RedisModule, SecurityModule, UserModel],
	controllers: [UsersController],
	providers: [UsersService],
})
export class UsersModule {}
