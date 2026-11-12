import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
	constructor() {}

	@Get('health')
	healthCheck(): string {
		return 'Server in healthy...';
	}

	@Get('success')
	paymentSuccess(): string {
		return 'Payment Success...';
	}

	@Get('failed')
	paymentFailed(): string {
		return 'Payment Failed...';
	}
}
