import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from './category.service.js';
import {
	categoryIdParamSchema,
	createCategorySchema,
	updateCategorySchema,
	type CategoryIdParam,
	type CreateCategoryDto,
	type UpdateCategoryDto,
} from './category.validation.js';
import { CustomValidationPipe } from '../../common/pipe/validation.pipe.js';
import { AuthGuard } from '../../common/guard/auth/auth.guard.js';
import { imageUploadOptions } from '../../common/utils/upload.options.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose';

@Controller('categories')
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	//* GET /categories
	@Get()
	getCategories() {
		return this.categoryService.getCategories();
	}

	//* GET /categories/:categoryId
	@Get(':categoryId')
	getCategoryById(
		@Param(new CustomValidationPipe(categoryIdParamSchema))
		params: CategoryIdParam,
	) {
		return this.categoryService.getCategoryById(params.categoryId);
	}

	//* POST /categories
	@Post()
	@UseGuards(AuthGuard)
	@UseInterceptors(FileInterceptor('image', imageUploadOptions))
	createCategory(
		@Body(new CustomValidationPipe(createCategorySchema))
		body: CreateCategoryDto,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
		@UploadedFile() file?: Express.Multer.File,
	) {

		return this.categoryService.createCategory(body, req.user, file);
	}

	//* PATCH /categories/:categoryId
	@Patch(':categoryId')
	@UseGuards(AuthGuard)
	@UseInterceptors(FileInterceptor('image', imageUploadOptions))
	updateCategory(
		@Param(new CustomValidationPipe(categoryIdParamSchema))
		params: CategoryIdParam,
		@Body(new CustomValidationPipe(updateCategorySchema))
		body: UpdateCategoryDto,
		@UploadedFile() file?: Express.Multer.File,
	) {
		return this.categoryService.updateCategory(
			params.categoryId,
			body,
			file,
		);
	}

	//* DELETE /categories/:categoryId
	@Delete(':categoryId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	deleteCategory(
		@Param(new CustomValidationPipe(categoryIdParamSchema))
		params: CategoryIdParam,
	) {
		return this.categoryService.deleteCategory(params.categoryId);
	}
}
