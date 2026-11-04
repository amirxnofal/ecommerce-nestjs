import {
	Injectable,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../../decorators/roles/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const roles = this.reflector.getAllAndOverride(Roles, [
			context.getHandler(),
			context.getClass(),
		]);
		if (!roles) {
			return true;
		}
		const { user } = context.switchToHttp().getRequest();
		
		if (!user || !roles.includes(user.role)) {
			throw new ForbiddenException('Unauthorized to do that');
		}
		return true;
	}
}
