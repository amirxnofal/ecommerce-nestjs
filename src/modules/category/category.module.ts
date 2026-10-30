import { Module } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CategoryController } from './category.controller.js';
import { CategoryModel } from '../../database/model/category.model.js';
import { subCategoryModel } from '../../database/model/subCategory.model.js';
import { RedisModule } from '../../common/services/redis/redis.module.js';
import { TokenModule } from '../../common/services/token/token.module.js';

@Module({
	imports: [CategoryModel, subCategoryModel, RedisModule, TokenModule],
	controllers: [CategoryController],
	providers: [CategoryService],
})
export class CategoryModule {}
