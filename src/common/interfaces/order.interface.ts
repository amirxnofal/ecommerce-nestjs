import { Types } from 'mongoose';
import { OrderStatus } from '../enums/order.enum.js';
import { ICoupon } from './coupon.interface.js';

export interface IOrder {
	_id: Types.ObjectId;
	orderId: string;
	address: string;
	phone: string;
	email: string;
	total: number;
	subTotal: number;
	discount: number;
	couponCode: Types.ObjectId;
	status: OrderStatus;
	paymentMethod: string;
	items: IOrderItem[];

	paymentId: string;
	paymentStatus: string;

	createdAt: Date;
	createdBy: Types.ObjectId;
	cancelledAt: Date;
	cancelledBy: Types.ObjectId;
	deletedAt: Date;
	deletedBy: Types.ObjectId;
	restoredAt: Date;
	restoredBy: Types.ObjectId;
}

export interface IOrderItem {
	product: Types.ObjectId;
	name: string;
	quantity: number;
	unitPrice: number;
	total: number;
}

export interface PreparedOrder {
	cartId: Types.ObjectId;
	items: IOrderItem[];
	total: number;
	discount: number;
	subTotal: number;
	coupon?: ICoupon;
	productsMap: Map<string, { name: string }>;
}
