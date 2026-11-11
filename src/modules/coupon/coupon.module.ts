import { Module } from '@nestjs/common';
import { CouponsController } from './coupon.controller.js';
import { CouponsService } from './coupon.service.js';
import { CouponModel } from '../../database/model/coupon.model.js';
import { RedisModule } from '../../common/services/redis/redis.module.js';
import { TokenModule } from '../../common/services/token/token.module.js';

@Module({
	controllers: [CouponsController],
	providers: [CouponsService],
	imports: [CouponModel, RedisModule, TokenModule],
	exports: [CouponsService], 
})
export class CouponModule {}
