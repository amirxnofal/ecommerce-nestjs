import { Module } from '@nestjs/common';
import { ProductService } from './product.service.js';
import { ProductController } from './product.controller.js';
import { TokenModule } from '../../common/services/token/token.module.js';
import { RedisModule } from '../../common/services/redis/redis.module.js';
import { CloudinaryModule } from '../../common/services/cloudinary/cloudinary.module.js';
import { ProductModel } from '../../database/model/product.model.js';
import { CategoryModel } from '../../database/model/category.model.js';
import { BrandModel } from '../../database/model/brand.model.js';
import { subCategoryModel } from '../../database/model/subCategory.model.js';
import { ProductResolver } from './product.resolver.js';

@Module({
	controllers: [ProductController],
	providers: [ProductService, ProductResolver],
	imports: [
		TokenModule,
		RedisModule,
		CloudinaryModule,
		ProductModel,
		CategoryModel,
		BrandModel,
		subCategoryModel,
	],
})
export class ProductModule {}
