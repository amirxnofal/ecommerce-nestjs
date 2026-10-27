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

@Controller('brand')
export class BrandController {
	constructor(private readonly brandService: BrandService) {}

	//* ------------------------ GET ALL BRANDS ------------------------ *//
	@Get()
	getAllBrands() {
		return this.brandService.getAllBrands();
	}

	//* ------------------------ CREATE BRAND ------------------------ *//
	@Post()
	@UseGuards(AuthGuard)
	@UseInterceptors(FileInterceptor('image', imageUploadOptions))
	createBrand(
		@Body(new CustomValidationPipe(createBrandSchema)) body: CreateBrandDto,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
		@UploadedFile() file?: Express.Multer.File,
	) {
		return this.brandService.createBrand(req.user.userId, body.name, file);
	}

	//* ------------------------ UPDATE BRAND ------------------------ *//
	@Patch(':slug')
	@UseGuards(AuthGuard)
	@UseInterceptors(FileInterceptor('image', imageUploadOptions))
	updateBrand(
		@Param('slug') slug: string,
		@Body(new CustomValidationPipe(updateBrandSchema)) body: UpdateBrandDto,
		@UploadedFile() file?: Express.Multer.File,
	) {
		return this.brandService.updateBrand(slug, body.name, file);
	}

	//* ------------------------ DELETE BRAND ------------------------ *//
	@Patch(':slug/delete')
	@UseGuards(AuthGuard)
	deleteBrand(@Param('slug') slug: string) {
		return this.brandService.deleteBrand(slug);
	}

	//* ------------------------ RESTORE BRAND ------------------------ *//
	@Patch(':slug/restore')
	@UseGuards(AuthGuard)
	restoreBrand(@Param('slug') slug: string) {
		return this.brandService.restoreBrand(slug);
	}

	//* ------------------------ GET BRAND BY ID ------------------------ *//
	@Get('slug')
	getBrandBySlug(@Param('slug') slug: string) {
		return this.brandService.getBrandBySlug(slug);
	}
}
