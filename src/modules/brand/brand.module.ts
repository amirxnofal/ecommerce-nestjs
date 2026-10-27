import { Module } from '@nestjs/common';
import { BrandService } from './brand.service.js';
import { BrandController } from './brand.controller.js';
import { brandModel } from '../../database/model/brand.model.js';
import { TokenModule } from '../../common/services/token/token.module.js';
import { RedisModule } from '../../common/services/redis/redis.module.js';

@Module({
	imports: [brandModel, TokenModule, RedisModule],
	controllers: [BrandController],
	providers: [BrandService],
})
export class BrandModule {}
