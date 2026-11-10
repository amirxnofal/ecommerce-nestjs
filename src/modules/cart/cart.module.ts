import { Module } from '@nestjs/common';
import { CartService } from './cart.service.js';
import { TokenModule } from '../../common/services/token/token.module.js';
import { RedisModule } from '../../common/services/redis/redis.module.js';
import { ProductModel } from '../../database/model/product.model.js';
import { CartResolver } from './cart.resolver.js';
import { CartModel } from '../../database/model/cart.model.js';

@Module({
	controllers: [],
	providers: [CartService, CartResolver],
	imports: [ProductModel, TokenModule, RedisModule, CartModel],
})
export class CartModule {}
