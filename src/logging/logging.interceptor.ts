import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { map, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler) {
		return next.handle().pipe(
			map((result) => {
				const {
					message = 'success',
					data,
					token,
					extra,
				} = result ?? {};
				return { success: true, message, data, token, extra };
			}), //  to reshape data,
		);
	}
}
