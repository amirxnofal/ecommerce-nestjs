import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
	healthCheck(): { status: string; message: string } {
		return { status: 'Ok', message: 'Server in healthy...' };
	}

	paymentSuccess(): { status: string; message: string } {
		return { status: 'Success', message: 'Payment Success...' };
	}

	paymentFailed(): { status: string; message: string } {
		return { status: 'Failed', message: 'Payment Failed...' };
	}
}
