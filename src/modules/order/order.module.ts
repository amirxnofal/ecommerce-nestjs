import { Module } from '@nestjs/common';
import { OrderService } from './order.service.js';
import { OrderController } from './order.controller.js';
import { OrderModel } from '../../database/model/order.model.js';
import { CartModel } from '../../database/model/cart.model.js';
import { ProductModel } from '../../database/model/product.model.js';
import { UserModel } from '../../database/model/user.model.js';
import { CouponModule } from '../coupon/coupon.module.js';
import { TokenModule } from '../../common/services/token/token.module.js';
import { RedisModule } from '../../common/services/redis/redis.module.js';
import { PaymentModule } from '../../common/services/payment/payment.module.js';

@Module({
	controllers: [OrderController],
	providers: [OrderService],
	imports: [
		OrderModel,
		CartModel,
		ProductModel,
		UserModel,
		CouponModule,
		TokenModule,
		RedisModule,
		PaymentModule,
	],
})
export class OrderModule {}
