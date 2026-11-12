import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { ZodError } from 'zod';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		if (host.getType<string>() !== 'http') return exception;

		const ctx = host.switchToHttp();
		const req = ctx.getRequest();
		const res = ctx.getResponse();

		let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
		let message = 'Internal server error';
		let errors: any[] | undefined;

		if (exception instanceof ZodError) {
			statusCode = 400;
			message = 'Validation failed';
			errors = exception.issues.map((i) => ({
				field: i.path.join('.'),
				message: i.message,
			}));
		} else if (exception instanceof HttpException) {
			statusCode = exception.getStatus();
			const body: any = exception.getResponse();
			if (typeof body === 'string') {
				message = body;
			} else {
				message = Array.isArray(body.message)
					? 'Validation failed'
					: body.message;
				errors =
					body.errors ??
					(Array.isArray(body.message) ? body.message : undefined);
			}
		} else if (exception?.code === 11000) {
			statusCode = 409;
			const field = Object.keys(exception.keyPattern ?? {})[0];
			message = `${field ?? 'Value'} already exists`;
		}

		res.status(statusCode).json({
			success: false,
			statusCode,
			message,
			...(errors && { errors }),
			path: req.url,
			timestamp: new Date().toISOString(),
		});
	}
}
