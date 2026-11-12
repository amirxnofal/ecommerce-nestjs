import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map } from 'rxjs';

export const ResponseMessage = Reflector.createDecorator<string>();

export class Paginated<T> {
	constructor(
		public items: T[],
		public meta: Record<string, any>,
	) {}
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
	constructor(private reflector: Reflector) {}

	intercept(ctx: ExecutionContext, next: CallHandler) {
		if (ctx.getType<string>() !== 'http') return next.handle();

		const message =
			this.reflector.get(ResponseMessage, ctx.getHandler()) ?? 'Success';

		return next.handle().pipe(
			map((result) => {
				if (result instanceof Paginated) {
					return {
						success: true,
						message,
						data: result.items,
						meta: result.meta,
					};
				}
				return { success: true, message, data: result ?? undefined };
			}),
		);
	}
}
