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
	Inject,
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
import {
	type ProductFiles,
	ProductFilesValidationPipe,
} from '../../common/pipe/file-fields-validation/product-files-validation.pipe.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import {
	CACHE_MANAGER,
	CacheInterceptor,
	CacheTTL,
} from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ResponseMessage } from '../../common/interceptors/response/response.interceptor.js';
import type { AuthRequest } from '../../common/types/auth-request.types.js';

@Controller('product')
export class ProductController {
	constructor(
		private readonly productService: ProductService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {}

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
	@ResponseMessage('Product created successfully')
	create(
		@Body() body: CreateProductDto,
		@Req() req: AuthRequest,
		@UploadedFiles(new ProductFilesValidationPipe())
		files: ProductFiles,
	) {
		return this.productService.create(req.user.userId, body, files);
	}

	@Get()
	@UseInterceptors(CacheInterceptor)
	@CacheTTL(10 * 1000)
	@ResponseMessage('Products retrieved successfully')
	findAll(@Query() query: PaginationQueryDto) {
		return this.productService.findAll(query);
	}

	@Get(':slug')
	@ResponseMessage('Product retrieved successfully')
	async findOne(@Param('slug') slug: string) {
		const key = `product:${slug}`;

		const cached = await this.cacheManager.get(key);
		if (cached) return cached;

		const product = await this.productService.findOne(slug);
		await this.cacheManager.set(key, product, 5 * 60 * 1000);
		return product;
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
	@ResponseMessage('Product updated successfully')
	async update(
		@Param('productId') productId: string,
		@Body() body: UpdateProductDto,
		@Req() req: AuthRequest,
		@UploadedFiles(new ProductFilesValidationPipe({ imageRequired: false }))
		files?: ProductFiles,
	) {
		const product = await this.productService.update(
			productId,
			body,
			req.user.userId,
			files,
		);
		await this.cacheManager.del(`product:${product.slug}`);
		return product;
	}

	@Delete(':id/delete')
	@UseGuards(AuthGuard, RolesGuard)
	@ResponseMessage('Product deleted successfully')
	async remove(@Param('id') id: string, @Req() req: AuthRequest) {
		const product = await this.productService.remove(id, req.user.userId);
		await this.cacheManager.del(`product:${product.slug}`);
		return product;
	}

	@Delete(':id/restore')
	@UseGuards(AuthGuard, RolesGuard)
	@ResponseMessage('Product restored successfully')
	async restore(@Param('id') id: string, @Req() req: AuthRequest) {
		const product = await this.productService.restore(id, req.user.userId);
		await this.cacheManager.del(`product:${product.slug}`);
		return product;
	}
}
