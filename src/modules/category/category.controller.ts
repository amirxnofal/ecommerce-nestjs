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
import { RolesGuard } from '../../common/guard/roles/roles.guard.js';
import { UserRole } from '../../common/enums/user.enum.js';
import { Roles } from '../../common/decorators/roles/roles.decorator.js';
import { ImageValidationPipe } from '../../common/pipe/image-validation/image-validation.pipe.js';
import { ResponseMessage } from '../../common/interceptors/response/response.interceptor.js';
@Controller('categories')
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	//* GET /categories
	@Get()
	@ResponseMessage('Categories fetched')
	getCategories() {
		return this.categoryService.getCategories();
	}

	//* GET /categories/:categoryId
	@Get(':categoryId')
	@ResponseMessage('Category fetched')
	getCategoryById(
		@Param(new CustomValidationPipe(categoryIdParamSchema))
		params: CategoryIdParam,
	) {
		return this.categoryService.getCategoryById(params.categoryId);
	}

	//* POST /categories
	@Post()
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN])
	@UseInterceptors(FileInterceptor('image', imageUploadOptions))
	@ResponseMessage('Category created')
	createCategory(
		@Body(new CustomValidationPipe(createCategorySchema))
		body: CreateCategoryDto,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
		@UploadedFile(ImageValidationPipe) file?: Express.Multer.File,
	) {
		return this.categoryService.createCategory(body, req.user, file);
	}

	//* PATCH /categories/:categoryId
	@Patch(':categoryId')
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN])
	@UseInterceptors(FileInterceptor('image', imageUploadOptions))
	@ResponseMessage('Category updated')
	updateCategory(
		@Param(new CustomValidationPipe(categoryIdParamSchema))
		params: CategoryIdParam,
		@Body(new CustomValidationPipe(updateCategorySchema))
		body: UpdateCategoryDto,
		@UploadedFile(ImageValidationPipe) file?: Express.Multer.File,
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
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN])
	@ResponseMessage('Category deleted')
	deleteCategory(
		@Param(new CustomValidationPipe(categoryIdParamSchema))
		params: CategoryIdParam,
	) {
		return this.categoryService.deleteCategory(params.categoryId);
	}
}
