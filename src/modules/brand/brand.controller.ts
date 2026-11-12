import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Post,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { BrandService } from './brand.service.js';
import { AuthGuard } from '../../common/guard/auth/auth.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageUploadOptions } from '../../common/utils/upload.options.js';
import { CustomValidationPipe } from '../../common/pipe/validation.pipe.js';
import type { CreateBrandDto, UpdateBrandDto } from './brand.validation.js';
import { createBrandSchema, updateBrandSchema } from './brand.validation.js';
import { Types } from 'mongoose';
import type { Request } from 'express';
import { RolesGuard } from '../../common/guard/roles/roles.guard.js';
import { Roles } from '../../common/decorators/roles/roles.decorator.js';
import { UserRole } from '../../common/enums/user.enum.js';
import { ImageValidationPipe } from '../../common/pipe/image-validation/image-validation.pipe.js';
import { ResponseMessage } from '../../common/interceptors/response/response.interceptor.js';
@Controller('brand')
export class BrandController {
	constructor(private readonly brandService: BrandService) {}

	//* ------------------------ GET ALL BRANDS ------------------------ *//
	@Get()
	@ResponseMessage('Brands fetched')
	getAllBrands() {
		return this.brandService.getAllBrands();
	}

	//* ------------------------ CREATE BRAND ------------------------ *//
	@Post()
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN])
	@UseInterceptors(FileInterceptor('image', imageUploadOptions))
	@ResponseMessage('Brand created')
	createBrand(
		@Body(new CustomValidationPipe(createBrandSchema)) body: CreateBrandDto,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
		@UploadedFile(ImageValidationPipe) file: Express.Multer.File,
	) {
		return this.brandService.createBrand(req.user.userId, body.name, file);
	}

	//* ------------------------ UPDATE BRAND ------------------------ *//
	@Patch(':slug')
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN])
	@UseInterceptors(FileInterceptor('image', imageUploadOptions))
	@ResponseMessage('Brand updated')
	updateBrand(
		@Param('slug') slug: string,
		@Body(new CustomValidationPipe(updateBrandSchema)) body: UpdateBrandDto,
		@UploadedFile(ImageValidationPipe) file?: Express.Multer.File,
	) {
		return this.brandService.updateBrand(slug, body.name, file);
	}

	//* ------------------------ DELETE BRAND ------------------------ *//
	@Patch(':slug/delete')
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN])
	@ResponseMessage('Brand deleted')
	deleteBrand(@Param('slug') slug: string) {
		return this.brandService.deleteBrand(slug);
	}

	//* ------------------------ RESTORE BRAND ------------------------ *//
	@Patch(':slug/restore')
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN])
	@ResponseMessage('Brand restored')
	restoreBrand(@Param('slug') slug: string) {
		return this.brandService.restoreBrand(slug);
	}

	//* ------------------------ GET BRAND BY SLUG ------------------------ *//
	@Get(':slug')
	@ResponseMessage('Brand fetched')
	async getBrandBySlug(@Param('slug') slug: string) {
		return await this.brandService.getBrandBySlug(slug);
	}
}
