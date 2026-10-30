import { Module } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CategoryController } from './category.controller.js';
import { categoryModel } from '../../database/model/category.model.js';
import { subCategoryModel } from '../../database/model/subCategory.model.js';
import { TokenService } from '../../common/services/token/token.service.js';
import { RedisService } from '../../common/services/redis/redis.service.js';

@Module({
	imports: [categoryModel, subCategoryModel],
	controllers: [CategoryController],
	providers: [CategoryService, TokenService, RedisService],
})
export class CategoryModule {}
