import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ItemDTO } from './gql/cart.gql.dto.js';
import { Cart } from '../../database/model/cart.model.js';
import { Product } from '../../database/model/product.model.js';

@Injectable()
export class CartService {
	constructor(
		@InjectModel(Cart.name)
		private readonly cartModel: Model<Cart>,

		@InjectModel(Product.name)
		private readonly productModel: Model<Product>,
	) {}

	// ---------- Helpers ----------
	private async validateProducts(products: ItemDTO[]) {
		const ids = products.map((p) => p.product);

		if (new Set(ids).size !== ids.length) {
			throw new BadRequestException('Duplicate products in request');
		}

		const count = await this.productModel.countDocuments({
			_id: { $in: ids },
			deletedAt: null,
		});
		if (count !== ids.length) {
			throw new NotFoundException('One or more products not found');
		}
	}

	private async getCartOrThrow(userId: Types.ObjectId) {
		const cart = await this.cartModel.findOne({ createdBy: userId });
		if (!cart) throw new NotFoundException('Cart not found');
		return cart;
	}

	// ---------- Create / Add ----------
	async createCart(userId: Types.ObjectId, products: ItemDTO[]) {
		await this.validateProducts(products);

		const cart = await this.cartModel.findOne({ createdBy: userId });

		if (!cart) {
			return this.cartModel.create({
				createdBy: userId,
				items: products.map((p) => ({
					product: new Types.ObjectId(p.product),
					quantity: p.quantity,
				})),
			});
		}

		for (const { product, quantity } of products) {
			const existing = cart.items.find(
				(i) => i.product.toString() === product,
			);
			if (existing) existing.quantity += quantity;
			else
				cart.items.push({
					product: new Types.ObjectId(product),
					quantity,
				});
		}

		return cart.save();
	}

	// ---------- Read ----------
	async findMyCart(userId: Types.ObjectId) {
		return this.getCartOrThrow(userId);
	}

	// ---------- Update quantity ----------
	async updateItemQuantity(
		userId: Types.ObjectId,
		productId: string,
		quantity: number,
	) {
		if (quantity < 1) {
			throw new BadRequestException('Quantity must be at least 1');
		}

		const cart = await this.cartModel.findOneAndUpdate(
			{
				createdBy: userId,
				'items.product': new Types.ObjectId(productId),
			},
			{ $set: { 'items.$.quantity': quantity } },
			{ returnDocument: 'after' },
		);
		if (!cart) throw new NotFoundException('Item not found in cart');
		return cart;
	}

	// ---------- Remove single item ----------
	async removeItem(userId: Types.ObjectId, productId: string) {
		const cart = await this.cartModel.findOneAndUpdate(
			{ createdBy: userId, 'items.product': new Types.ObjectId(productId) },
			{ $pull: { items: { product: new Types.ObjectId(productId) } } },
			{ returnDocument: 'after' },
		);
		if (!cart) throw new NotFoundException('Item not found in cart');
		return cart;
	}

	// ---------- Clear items ----------
	async clearCart(userId: Types.ObjectId) {
		const cart = await this.cartModel.findOneAndUpdate(
			{ createdBy: userId },
			{ $set: { items: [] } },
			{ returnDocument: 'after' },
		);
		if (!cart) throw new NotFoundException('Cart not found');
		return cart;
	}

	// ---------- Delete the whole cart ----------
	async remove(userId: Types.ObjectId) {
		const cart = await this.cartModel.findOneAndDelete({
			createdBy: userId,
		});
		if (!cart) throw new NotFoundException('Cart not found');
		return { message: 'Cart deleted successfully' };
	}
}
