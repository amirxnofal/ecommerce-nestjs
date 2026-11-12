import {
	Body,
	Controller,
	Param,
	Patch,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { OrderService } from './order.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { AuthGuard } from '../../common/guard/auth/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles/roles.guard.js';
import { Roles } from '../../common/decorators/roles/roles.decorator.js';
import { UserRole } from '../../common/enums/user.enum.js';
import { ResponseMessage } from '../../common/interceptors/response/response.interceptor.js';

@Controller('order')
@UseGuards(AuthGuard, RolesGuard)
export class OrderController {
	constructor(private readonly orderService: OrderService) {}

	@Post('cash')
	@ResponseMessage('Cash order created successfully')
	createCashOrder(
		@Body() body: CreateOrderDto,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.orderService.createCashOnDeliveryOrder(
			body,
			req.user.userId,
		);
	}

	@Post('card')
	@ResponseMessage('Card order created successfully')
	createCardOrder(
		@Body() body: CreateOrderDto,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.orderService.createOnlinePaymentOrder(
			body,
			req.user.userId,
		);
	}

	@Patch(':id/status')
	@Roles([UserRole.ADMIN])
	@ResponseMessage('Order status updated successfully')
	updateStatus(
		@Param('id') id: string,
		@Body() body: UpdateOrderStatusDto,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.orderService.updateStatus(id, body.status, req.user.userId);
	}
}
