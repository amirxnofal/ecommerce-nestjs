import { Module } from '@nestjs/common';
import { categoryModel } from '../../database/model/category.model.js';
import { subCategoryModel } from '../../database/model/subCategory.model.js';
import { SubCategoryController } from './subCategory.controller.js';
import { SubCategoryService } from './subCategory.service.js';
import { TokenService } from '../../common/services/token/token.service.js';
import { RedisService } from '../../common/services/redis/redis.service.js';

@Module({
	imports: [categoryModel, subCategoryModel],
	controllers: [SubCategoryController],
	providers: [SubCategoryService, TokenService, RedisService],
})
export class SubCategoryModule {}
