import { Module } from '@nestjs/common';
import { CategoryModel } from '../../database/model/category.model.js';
import { subCategoryModel } from '../../database/model/subCategory.model.js';
import { SubCategoryController } from './subCategory.controller.js';
import { SubCategoryService } from './subCategory.service.js';
import { TokenModule } from '../../common/services/token/token.module.js';
import { RedisModule } from '../../common/services/redis/redis.module.js';
import { CloudinaryModule } from '../../common/services/cloudinary/cloudinary.module.js';

@Module({
	imports: [CategoryModel, subCategoryModel, TokenModule, RedisModule,CloudinaryModule],
	controllers: [SubCategoryController],
	providers: [SubCategoryService],
})
export class SubCategoryModule {}
