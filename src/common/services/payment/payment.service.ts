import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { env } from '../../../config/env.service.js';

export type StripeCheckoutInput = {
	customer_email: string;
	metadata: Stripe.MetadataParam;
	discounts: Stripe.Checkout.SessionCreateParams.Discount[];
	line_items: Stripe.Checkout.SessionCreateParams.LineItem[];
	success_url: string;
	cancel_url: string;
};

export type StripeCouponInput = {
	name: string;
	duration: Stripe.CouponCreateParams.Duration;
	amountOff?: number;
	percentOff?: number;
	currency?: string;
};

@Injectable()
export class PaymentService {
	private stripe: Stripe;
	constructor() {
		this.stripe = new Stripe(env.stripeSeceretKey);
	}

	async checkoutSession(data: StripeCheckoutInput) {
		return await this.stripe.checkout.sessions.create({
			customer_email: data.customer_email,
			metadata: data.metadata,
			discounts: data.discounts,
			line_items: data.line_items,
			success_url: data.success_url || 'http://localhost:3000/success',
			cancel_url: data.cancel_url || 'http://localhost:3000/failed',
			allowed_payment_method_types: ['card'],
			mode: 'payment',
		});
	}

	async createCoupon(data: StripeCouponInput) {
		return this.stripe.coupons.create({
			name: data.name,
			duration: data.duration,
			...(data.amountOff
				? { amount_off: data.amountOff, currency: data.currency }
				: { percent_off: data.percentOff }),
		});
	}
}
