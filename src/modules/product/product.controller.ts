import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
	UseInterceptors,
	Req,
	UploadedFiles,
	Query,
} from '@nestjs/common';
import { ProductService } from './product.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { AuthGuard } from '../../common/guard/auth/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles/roles.guard.js';
import { Roles } from '../../common/decorators/roles/roles.decorator.js';
import { UserRole } from '../../common/enums/user.enum.js';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { imageUploadOptions } from '../../common/utils/upload.options.js';
import { Types } from 'mongoose';
import {
	type ProductFiles,
	ProductFilesValidationPipe,
} from '../../common/pipe/file-fields-validation/product-files-validation.pipe.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';

@Controller('product')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@Post()
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN, UserRole.SELLER])
	@UseInterceptors(
		FileFieldsInterceptor(
			[
				{ name: 'image', maxCount: 1 },
				{ name: 'gallery', maxCount: 8 },
			],
			imageUploadOptions,
		),
	)
	create(
		@Body() body: CreateProductDto,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
		@UploadedFiles(new ProductFilesValidationPipe())
		files: ProductFiles,
	) {
		return this.productService.create(req.user.userId, body, files);
	}

	@Get()
	findAll(@Query() query: PaginationQueryDto) {
		return this.productService.findAll(query);
	}

	@Get(':slug')
	findOne(@Param('slug') slug: string) {
		return this.productService.findOne(slug);
	}

	@Patch(':productId')
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN, UserRole.SELLER])
	@UseInterceptors(
		FileFieldsInterceptor(
			[
				{ name: 'image', maxCount: 1 },
				{ name: 'gallery', maxCount: 8 },
			],
			imageUploadOptions,
		),
	)
	update(
		@Param('productId') productId: string,
		@Body() body: UpdateProductDto,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
		@UploadedFiles(new ProductFilesValidationPipe({ imageRequired: false }))
		files?: ProductFiles,
	) {
		return this.productService.update(
			productId,
			body,
			req.user.userId,
			files,
		);
	}

	@Delete(':id/delete')
	@UseGuards(AuthGuard, RolesGuard)
	remove(
		@Param('id') id: string,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.productService.remove(id, req.user.userId);
	}

	@Delete(':id/restore')
	@UseGuards(AuthGuard, RolesGuard)
	restore(
		@Param('id') id: string,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.productService.restore(id, req.user.userId);
	}
}
