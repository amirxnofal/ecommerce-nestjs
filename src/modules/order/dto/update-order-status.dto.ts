import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../../common/enums/order.enum.js';

export class UpdateOrderStatusDto {
	@IsEnum(OrderStatus)
	status: OrderStatus;
}
