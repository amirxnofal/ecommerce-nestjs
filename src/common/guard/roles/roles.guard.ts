import {
	Injectable,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../../decorators/roles/roles.decorator.js';
import { CTXType } from '../../interfaces/context.interface.js';
import { AuthRequest } from '../auth/auth.guard.js';
import { GqlExecutionContext } from '@nestjs/graphql';

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
		let req: AuthRequest;

		switch (context.getType<CTXType>()) {
			case 'http':
				req = context.switchToHttp().getRequest<AuthRequest>();
				break;

			case 'graphql':
				req = GqlExecutionContext.create(context).getContext()
					.req as AuthRequest;
				break;

			default:
				throw new UnauthorizedException('Invalid request type');
		}

		const { user } = req;

		if (!user || !roles.includes(user.role)) {
			throw new ForbiddenException('Unauthorized to do that');
		}
		return true;
	}
}
