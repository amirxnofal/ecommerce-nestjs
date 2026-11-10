import {
	Args,
	Context,
	ID,
	Int,
	Mutation,
	Query,
	Resolver,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { CartDTO, ItemDTO } from './gql/cart.gql.dto.js';
import { CartService } from './cart.service.js';
import { AuthGuard } from '../../common/guard/auth/auth.guard.js';

@Resolver(() => CartDTO)
@UseGuards(AuthGuard)
export class CartResolver {
	constructor(private readonly cartService: CartService) {}

	//* <---------------- Query Section ----------------> *\\
	@Query(() => CartDTO, {
		name: 'myCart',
		description: 'Retrieves the user cart',
	})
	myCart(
		@Context('req') req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.cartService.findMyCart(new Types.ObjectId(req.user.userId));
	}

	//* <---------------- Mutation Section ----------------> *\\
	@Mutation(() => CartDTO, {
		name: 'createCart',
		description: 'Creates a cart or adds products to the existing one',
	})
	createCart(
		@Args('products', { type: () => [ItemDTO] }) products: ItemDTO[],
		@Context('req') req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.cartService.createCart(
			new Types.ObjectId(req.user.userId),
			products,
		);
	}

	@Mutation(() => CartDTO, { name: 'updateCartItem' })
	updateCartItem(
		@Args('product', { type: () => ID }) product: string,
		@Args('quantity', { type: () => Int }) quantity: number,
		@Context('req') req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.cartService.updateItemQuantity(
			new Types.ObjectId(req.user.userId),
			product,
			quantity,
		);
	}

	@Mutation(() => CartDTO, { name: 'removeCartItem' })
	removeCartItem(
		@Args('product', { type: () => ID }) product: string,
		@Context('req') req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.cartService.removeItem(
			new Types.ObjectId(req.user.userId),
			product,
		);
	}

	@Mutation(() => CartDTO, { name: 'clearCart' })
	clearCart(
		@Context('req') req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.cartService.clearCart(new Types.ObjectId(req.user.userId));
	}

	@Mutation(() => String, { name: 'removeCart' })
	async removeCart(
		@Context('req') req: Request & { user: { userId: Types.ObjectId } },
	) {
		const { message } = await this.cartService.remove(
			new Types.ObjectId(req.user.userId),
		);
		return message;
	}
}
