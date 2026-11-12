import {
	Args,
	Context,
	ID,
	Mutation,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from '@nestjs/graphql';
import {
	ProductPagesType,
	ProductType,
	RefType,
} from './gql/product.gql.dto.js';
import { PaginationArgs } from './gql/pagination.gql.dto.js';
import { ProductService } from './product.service.js';
import { Types } from 'mongoose';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../../common/guard/roles/roles.guard.js';
import { AuthGuard } from '../../common/guard/auth/auth.guard.js';
import { Roles } from '../../common/decorators/roles/roles.decorator.js';
import { UserRole } from '../../common/enums/user.enum.js';
import type { AuthRequest } from '../../common/types/auth-request.types.js';

@Resolver(() => ProductType)
export class ProductResolver {
	constructor(private readonly productService: ProductService) {}

	//* <---------------- Resolve Field Section (Populate) ----------------> *\\
	@ResolveField(() => RefType, { nullable: true })
	category(@Parent() product: { category: Types.ObjectId }) {
		return this.productService.findRelation('category', product.category);
	}
	@ResolveField(() => RefType, { nullable: true })
	subCategory(@Parent() product: { subCategory: Types.ObjectId }) {
		return this.productService.findRelation(
			'subCategory',
			product.subCategory,
		);
	}
	@ResolveField(() => RefType, { nullable: true })
	brand(@Parent() product: { brand: Types.ObjectId }) {
		return this.productService.findRelation('brand', product.brand);
	}

	//* <---------------- Query Section ----------------> *\\
	@Query(() => ProductPagesType, {
		name: 'findAllProducts',
		description: 'Retrieves all products',
		nullable: false,
	})
	async findAllProducts(@Args() args: PaginationArgs) {
		return this.productService.findAllByGQL(args);
	}

	@Query(() => ProductType, {
		name: 'findProductBySlug',
		description: 'Retrieves a product by its slug',
		nullable: false,
	})
	async findProductBySlug(@Args('slug') slug: string) {
		return this.productService.findOneByGQL(slug);
	}

	//* <---------------- Mutation Section ----------------> *\\
	@Mutation(() => String, {
		name: 'removeProduct',
		description: 'Soft deletes a product',
	})
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN, UserRole.SELLER])
	async removeProduct(
		@Args('id', { type: () => ID }) id: string,
		@Context('req') req: AuthRequest,
	) {
		const { message } = await this.productService.remove(
			id,
			req.user.userId,
		);
		return message;
	}

	@Mutation(() => ProductType, {
		name: 'restoreProduct',
		description: 'Restores a soft-deleted product',
	})
	@UseGuards(AuthGuard, RolesGuard)
	@Roles([UserRole.ADMIN, UserRole.SELLER])
	async restoreProduct(
		@Args('id', { type: () => ID }) id: string,
		@Context('req') req: AuthRequest,
	) {
		return this.productService.restore(id, req.user.userId);
	}
}
