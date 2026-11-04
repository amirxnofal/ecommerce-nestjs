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
	Query,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { SubCategoryService } from './subCategory.service.js';
import {
	subCategoryIdParamSchema,
	subCategoryQuerySchema,
	createSubCategorySchema,
	updateSubCategorySchema,
	type SubCategoryIdParam,
	type SubCategoryQuery,
	type CreateSubCategoryDto,
	type UpdateSubCategoryDto,
} from './subCategory.validation.js';
import { CustomValidationPipe } from '../../common/pipe/validation.pipe.js';
import { AuthGuard } from '../../common/guard/auth/auth.guard.js';
import { imageUploadOptions } from '../../common/utils/upload.options.js';
import { RolesGuard } from '../../common/guard/roles/roles.guard.js';
import { UserRole } from '../../common/enums/user.enum.js';
import { Roles } from '../../common/decorators/roles/roles.decorator.js';
import { ImageValidationPipe } from '../../common/pipe/image-validation/image-validation.pipe.js';

@Controller('subcategories')
export class SubCategoryController {
	constructor(private readonly subCategoryService: SubCategoryService) {}

	//* GET /subcategories?category=<id>
	@Get()
	getSubCategories(
		@Query(new CustomValidationPipe(subCategoryQuerySchema))
		query: SubCategoryQuery,
	) {
		return this.subCategoryService.getSubCategories(query.category);
	}

	//* GET /subcategories/:subCategoryId
	@Get(':subCategoryId')
	getSubCategoryById(
		@Param(new CustomValidationPipe(subCategoryIdParamSchema))
		params: SubCategoryIdParam,
	) {
		return this.subCategoryService.getSubCategoryById(params.subCategoryId);
	}

	//* POST /subcategories
	@Post()
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN])
	@UseInterceptors(FileInterceptor('image', imageUploadOptions))
	createSubCategory(
		@Body(new CustomValidationPipe(createSubCategorySchema))
		body: CreateSubCategoryDto,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
		@UploadedFile(ImageValidationPipe) file: Express.Multer.File,
	) {
		return this.subCategoryService.createSubCategory(
			body,
			req.user.userId,
			file,
		);
	}

	//* PATCH /subcategories/:subCategoryId
	@Patch(':subCategoryId')
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN])
	@UseInterceptors(FileInterceptor('image', imageUploadOptions))
	updateSubCategory(
		@Param(new CustomValidationPipe(subCategoryIdParamSchema))
		params: SubCategoryIdParam,
		@Body(new CustomValidationPipe(updateSubCategorySchema))
		body: UpdateSubCategoryDto,
		@UploadedFile(ImageValidationPipe) file?: Express.Multer.File,
	) {
		return this.subCategoryService.updateSubCategory(
			params.subCategoryId,
			body,
			file,
		);
	}

	//* DELETE /subcategories/:subCategoryId
	@Delete(':subCategoryId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN])
	deleteSubCategory(
		@Param(new CustomValidationPipe(subCategoryIdParamSchema))
		params: SubCategoryIdParam,
	) {
		return this.subCategoryService.deleteSubCategory(params.subCategoryId);
	}
}
