import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';
import { OrderStatus } from '../../common/enums/order.enum.js';
import { IOrderItem } from '../../common/interfaces/order.interface.js';

@Schema({ _id: false })
export class OrderItem {
	@Prop({ type: Types.ObjectId, ref: 'Product', required: true })
	product: Types.ObjectId;

	@Prop({ type: String, required: true, trim: true })
	name: string;

	@Prop({ type: Number, required: true, min: 1 })
	quantity: number;

	@Prop({ type: Number, required: true, min: 0 })
	unitPrice: number;

	@Prop({ type: Number, required: true, min: 0 })
	total: number;
}

@Schema({ timestamps: true })
export class Order {
	@Prop({ unique: true, type: String, required: true })
	orderId: string;
	@Prop({ type: String, required: true })
	address: string;
	@Prop({ type: String, required: true })
	phone: string;
	@Prop({ type: String, required: true })
	email: string;
	@Prop({ type: Number, required: true, min: 0 })
	total: number;
	@Prop({ type: Number, required: true, min: 0 })
	subTotal: number;
	@Prop({ type: Number, required: true, min: 0 })
	discount: number;
	@Prop({ type: Types.ObjectId, ref: 'Coupon' })
	couponCode: Types.ObjectId;
	@Prop({
		type: String,
		required: true,
		enum: OrderStatus,
		default: OrderStatus.PENDING,
	})
	status: OrderStatus;
	@Prop({ type: String, required: true })
	paymentMethod: string;
	@Prop({ type: [OrderItem], required: true })
	items: IOrderItem[];
	@Prop({ type: String, required: false })
	paymentId: string;
	@Prop({ type: String, required: true })
	paymentStatus: string;
	@Prop({ type: Date, default: Date.now })
	createdAt: Date;
	@Prop({ type: Types.ObjectId, ref: 'User', required: true })
	createdBy: Types.ObjectId;
	@Prop({ type: Date })
	cancelledAt: Date;
	@Prop({ type: Types.ObjectId, ref: 'User' })
	cancelledBy: Types.ObjectId;
	@Prop({ type: Date })
	deletedAt: Date;
	@Prop({ type: Types.ObjectId, ref: 'User' })
	deletedBy: Types.ObjectId;
	@Prop({ type: Date })
	restoredAt: Date;
	@Prop({ type: Types.ObjectId, ref: 'User' })
	restoredBy: Types.ObjectId;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
export const OrderModel = MongooseModule.forFeature([
	{
		name: Order.name,
		schema: OrderSchema,
	},
]);
