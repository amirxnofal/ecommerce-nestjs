import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../../common/guard/roles/roles.guard.js';
import { AuthGuard } from '../../common/guard/auth/auth.guard.js';
import { Roles } from '../../common/decorators/roles/roles.decorator.js';
import { UserRole } from '../../common/enums/user.enum.js';
import { Types } from 'mongoose';
import { CouponsService } from './coupon.service.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';
import { ApplyCouponDto } from './dto/apply-coupon.dto.js';
import { ResponseMessage } from '../../common/interceptors/response/response.interceptor.js';

@Controller('coupons')
@UseGuards(AuthGuard, RolesGuard)
export class CouponsController {
	constructor(private readonly couponsService: CouponsService) {}

	@Post()
	@Roles([UserRole.ADMIN])
	@ResponseMessage('Coupon created successfully')
	create(
		@Body() body: CreateCouponDto,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.couponsService.create(body, req.user.userId);
	}

	@Get()
	@Roles([UserRole.ADMIN])
	@ResponseMessage('Coupons retrieved successfully')
	findAll() {
		return this.couponsService.findAll();
	}

	@Patch(':id')
	@Roles([UserRole.ADMIN])
	@ResponseMessage('Coupon updated successfully')
	update(@Param('id') id: string, @Body() body: UpdateCouponDto) {
		return this.couponsService.update(id, body);
	}

	@Delete(':id')
	@Roles([UserRole.ADMIN])
	@ResponseMessage('Coupon deleted successfully')
	remove(
		@Param('id') id: string,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.couponsService.softDelete(id, req.user.userId);
	}

	@Patch(':id/restore')
	@Roles([UserRole.ADMIN])
	@ResponseMessage('Coupon restored successfully')
	restore(
		@Param('id') id: string,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
	) {
		return this.couponsService.restore(id, req.user.userId);
	}

	@Post('apply')
	@ResponseMessage('Coupon applied successfully')
	async apply(
		@Body() body: ApplyCouponDto,
		@Req() req: Request & { user: { userId: Types.ObjectId } },
	) {
		const { coupon, discount } = await this.couponsService.validate(
			body.code,
			req.user.userId,
			body.subtotal,
		);
		return { code: coupon.code, discount, total: body.subtotal - discount };
	}
}
