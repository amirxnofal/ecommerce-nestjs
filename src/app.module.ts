import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenModule } from './common/services/token/token.module.js';
import { RedisModule } from './common/services/redis/redis.module.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SecurityService } from './common/services/security/security.service.js';
import { UsersModule } from './modules/user/user.module.js';
import { BrandModule } from './modules/brand/brand.module.js';
import { CategoryModule } from './modules/category/category.module.js';
import { SubCategoryModule } from './modules/subCategory/subCategory.module.js';
import { ProductModule } from './modules/product/product.module.js';
import { CacheModule } from '@nestjs/cache-manager';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path/win32';
import { CartModule } from './modules/cart/cart.module.js';
import { CouponModule } from './modules/coupon/coupon.module.js';
import { OrderModule } from './modules/order/order.module.js';
import { PaymentService } from './common/services/payment/payment.service.js';
import { PaymentModule } from './common/services/payment/payment.module.js';
import { ResponseInterceptor } from './common/interceptors/response/response.interceptor.js';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter.js';

@Module({
	controllers: [AppController],
	providers: [
		AppService,
		SecurityService,
		PaymentService,
		{ provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
		{ provide: APP_FILTER, useClass: AllExceptionsFilter },
	],
	imports: [
		ConfigModule.forRoot({
			envFilePath: ['.env.dev', '.env.prod'],
			isGlobal: true,
		}),

		MongooseModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>('MONGODB_URI'),
				connectionFactory: (connection: Connection) => {
					const logger = new Logger('MongoDB');

					if (connection.readyState === 1) {
						logger.log('Connected to MongoDB');
					}

					connection.on('connected', () =>
						logger.log('Connected to MongoDB'),
					);
					connection.on('error', (err) =>
						logger.error('Connection error', err),
					);

					return connection;
				},
			}),
		}),

		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
			graphiql: true,
		}),

		CacheModule.register({
			isGlobal: true,
			ttl: 10000, // 10 seconds
		}),

		TokenModule,
		RedisModule,

		AuthModule,
		UsersModule,
		BrandModule,
		CategoryModule,
		SubCategoryModule,
		ProductModule,
		CartModule,
		CouponModule,
		OrderModule,
		PaymentModule,
	],
})
export class AppModule {}
