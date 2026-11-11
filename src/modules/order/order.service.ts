import { randomBytes } from 'node:crypto';
import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../../database/model/order.model.js';
import { Cart } from '../../database/model/cart.model.js';
import { Product } from '../../database/model/product.model.js';
import { User } from '../../database/model/user.model.js';
import {
	OrderStatus,
	PaymentMethod,
	PaymentStatus,
} from '../../common/enums/order.enum.js';
import { CouponsService } from '../coupon/coupon.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { ICoupon } from '../../common/interfaces/coupon.interface.js';
import { PaymentService } from '../../common/services/payment/payment.service.js';
import {
	IOrderItem,
	PreparedOrder,
} from '../../common/interfaces/order.interface.js';

const MAX_DISCOUNT_RATIO = 0.2;
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	[OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
	[OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
	[OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
	[OrderStatus.DELIVERED]: [],
	[OrderStatus.CANCELLED]: [],
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const generateOrderId = () =>
	`ORD-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;

@Injectable()
export class OrderService {
	constructor(
		@InjectModel(Order.name) private orderModel: Model<Order>,
		@InjectModel(Cart.name) private cartModel: Model<Cart>,
		@InjectModel(Product.name) private productModel: Model<Product>,
		@InjectModel(User.name) private userModel: Model<User>,
		private readonly couponsService: CouponsService,
		private readonly paymentService: PaymentService,
	) {}

	//* <------------- Main Methods [Cash&Card] -------------> *\\
	async createCashOnDeliveryOrder(
		body: CreateOrderDto,
		userId: Types.ObjectId,
	) {
		const prepared = await this.prepareOrder(body, userId);
		const order = await this.reserveAndCreate(
			prepared,
			body,
			userId,
			PaymentMethod.CASH,
		);

		await this.cartModel.deleteOne({ _id: prepared.cartId });
		return order;
	}

	async createOnlinePaymentOrder(
		body: CreateOrderDto,
		userId: Types.ObjectId,
	) {
		const prepared = await this.prepareOrder(body, userId);
		const order = await this.reserveAndCreate(
			prepared,
			body,
			userId,
			PaymentMethod.CARD,
		);

		try {
			const { paymentId, paymentUrl } =
				await this.createStripeSession(order);
			order.paymentId = paymentId;
			await order.save();
			return { order, paymentUrl };
		} catch (err) {
			await this.rollbackOrder(order, userId);
			throw err;
		}
	}

	async updateStatus(
		id: string,
		status: OrderStatus,
		adminId: Types.ObjectId,
	) {
		const order = await this.orderModel.findOne({
			_id: id,
			deletedAt: null,
		});
		if (!order) throw new NotFoundException('Order not found');

		if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
			throw new BadRequestException(
				`Cannot change status from ${order.status} to ${status}`,
			);
		}

		if (status === OrderStatus.CANCELLED) {
			return this.rollbackOrder(order, adminId);
		}

		order.status = status;
		return order.save();
	}

	//* <------------- Helpers -------------> *\\

	private async prepareOrder(
		body: CreateOrderDto,
		userId: Types.ObjectId,
	): Promise<PreparedOrder> {
		const { couponCode } = body;

		// 1- check user exist
		const userExists = await this.userModel.exists({ _id: userId });
		if (!userExists) throw new NotFoundException('User not found');

		// 2- check cart exist
		const cart = await this.cartModel.findOne({
			createdBy: new Types.ObjectId(userId),
		});
		if (!cart || !cart.items?.length) {
			throw new BadRequestException('Cart is empty');
		}

		// 3- check products exist + stock
		const ids = cart.items.map((i) => i.product);
		const products = await this.productModel
			.find({ _id: { $in: ids }, deletedAt: null })
			.lean();
		const productsMap = new Map(products.map((p) => [String(p._id), p]));

		const items: IOrderItem[] = [];
		const unavailable: string[] = [];
		const lowStock: string[] = [];
		let total = 0;

		for (const item of cart.items) {
			const prod = productsMap.get(String(item.product));
			if (!prod) {
				unavailable.push(String(item.product));
				continue;
			}
			if (prod.stock < item.quantity) {
				lowStock.push(prod.name);
				continue;
			}
			const lineTotal = round2(item.quantity * prod.finalPrice);
			items.push({
				product: prod._id,
				name: prod.name,
				quantity: item.quantity,
				unitPrice: prod.finalPrice,
				total: lineTotal,
			});
			total += lineTotal;
		}

		if (unavailable.length) {
			throw new BadRequestException(
				`Some products are no longer available: ${unavailable.join(', ')}`,
			);
		}
		if (lowStock.length) {
			throw new BadRequestException(
				`Not enough stock for: ${lowStock.join(', ')}`,
			);
		}
		total = round2(total);

		// 4- coupon
		let discount = 0;
		let coupon: ICoupon | undefined;

		if (couponCode) {
			const result = await this.couponsService.validate(
				couponCode,
				userId,
				total,
			);
			if (result.discount > total * MAX_DISCOUNT_RATIO) {
				throw new BadRequestException(
					'Discount exceeds the allowed limit for this order',
				);
			}
			coupon = result.coupon;
			discount = result.discount;
		}

		const subTotal = round2(total - discount);

		return {
			cartId: cart._id,
			items,
			total,
			discount,
			subTotal,
			coupon,
			productsMap,
		};
	}

	// Make order with rollback if smth went wrong
	private async reserveAndCreate(
		prepared: PreparedOrder,
		body: CreateOrderDto,
		userId: Types.ObjectId,
		paymentMethod: PaymentMethod,
	): Promise<OrderDocument> {
		const { items, total, discount, subTotal, coupon, productsMap } =
			prepared;
		const { address, phone, email } = body;

		const reserved: { id: Types.ObjectId; quantity: number }[] = [];
		const outOfStock: string[] = [];
		let couponRedeemed = false;

		try {
			for (const item of items) {
				const res = await this.productModel.updateOne(
					{
						_id: item.product,
						deletedAt: null,
						stock: { $gte: item.quantity },
					},
					{ $inc: { stock: -item.quantity } },
				);

				if (res.modifiedCount === 0) {
					const prod = productsMap.get(String(item.product));
					outOfStock.push(prod?.name ?? String(item.product));
					continue;
				}
				reserved.push({ id: item.product, quantity: item.quantity });
			}

			if (outOfStock.length) {
				throw new BadRequestException(
					`These products are out of stock: ${outOfStock.join(', ')}`,
				);
			}

			if (coupon) {
				await this.couponsService.redeem(coupon._id, userId);
				couponRedeemed = true;
			}

			return await this.orderModel.create({
				orderId: generateOrderId(),
				address,
				phone,
				email,
				total,
				discount,
				subTotal,
				couponCode: coupon?._id,
				paymentMethod,
				paymentStatus: PaymentStatus.PENDING,
				items,
				createdBy: userId,
			});
		} catch (err) {
			await Promise.all(
				reserved.map((r) =>
					this.productModel.updateOne(
						{ _id: r.id },
						{ $inc: { stock: r.quantity } },
					),
				),
			);
			if (coupon && couponRedeemed) {
				await this.couponsService.release(coupon._id, userId);
			}
			throw err;
		}
	}

	// <------- If Order Canceled return every thing to original status ------->
	private async rollbackOrder(
		order: OrderDocument,
		cancelledBy: Types.ObjectId,
	) {
		order.status = OrderStatus.CANCELLED;
		order.cancelledAt = new Date();
		order.cancelledBy = cancelledBy;
		if (order.paymentStatus === PaymentStatus.PENDING) {
			order.paymentStatus = PaymentStatus.FAILED;
		}
		//! if order canceled make stripe refund (do it later)

		const saved = await order.save();

		await Promise.all(
			order.items.map((item) =>
				this.productModel.updateOne(
					{ _id: item.product },
					{ $inc: { stock: item.quantity } },
				),
			),
		);

		if (order.couponCode) {
			await this.couponsService.release(
				order.couponCode,
				order.createdBy,
			);
		}

		return saved;
	}

	private async createStripeSession(order: OrderDocument) {
		const stripeCoupon =
			order.discount > 0
				? await this.paymentService.createCoupon({
						name: order.orderId,
						duration: 'once',
						amountOff: Math.round(order.discount * 100),
						currency: 'egp',
					})
				: null;

		const session = await this.paymentService.checkoutSession({
			customer_email: order.email,
			metadata: { orderId: String(order._id) },
			discounts: stripeCoupon ? [{ coupon: stripeCoupon.id }] : [],
			line_items: order.items.map((item) => ({
				quantity: item.quantity,
				price_data: {
					currency: 'egp',
					unit_amount: Math.round(item.unitPrice * 100),
					product_data: { name: item.name },
				},
			})),
			success_url: `http://localhost:3000/success`,
			cancel_url: `http://localhost:3000/failed`,
		});

		return { paymentId: session.id, paymentUrl: session.url! };
	}
}
