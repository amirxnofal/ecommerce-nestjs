import {
	Injectable,
	Logger,
	OnModuleInit,
	ServiceUnavailableException,
} from '@nestjs/common';
import nodemailer from 'nodemailer';
import { otpEmailTemplate } from './template/otp.template.js';
import { env } from '../../../config/env.service.js';

interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class EmailService implements OnModuleInit {
	private readonly logger = new Logger(EmailService.name);

	private readonly transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: env.googleAppEmail,
			pass: env.googleAppPassword,
		},
		connectionTimeout: 10_000,
		greetingTimeout: 10_000,
		socketTimeout: 15_000,
	});

	async onModuleInit() {
		try {
			await this.transporter.verify();
			this.logger.log('Email service connected');
		} catch (error) {
			this.logger.warn(
				`Email service not ready: ${(error as Error).message}`,
			);
		}
	}

	// عشان اتاكد انه الحدمه متحاولش تبعت الايميل والمشكله من  عندي اصلا
	private isRetryable(error: any): boolean {
		const code = error?.responseCode;
		return !(code && code >= 500);
	}

	async sendEmail(
		{ to, subject, html, text }: SendEmailOptions,
		retries = 2,
	): Promise<void> {
		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				const info = await this.transporter.sendMail({
					from: env.emailSenderName,
					to,
					subject,
					html,
					text,
				});
				this.logger.log(`Email sent to: ${info.accepted.join(', ')}`);
				return;
			} catch (error) {
				const isLast = attempt === retries;
				this.logger.warn(
					`Send failed (attempt ${attempt + 1}/${retries + 1}): ${(error as Error).message}`,
				);

				if (isLast || !this.isRetryable(error)) {
					this.logger.error('Failed to send email', error);
					throw new ServiceUnavailableException(
						'Failed to send email',
					);
				}

				await sleep(500 * 2 ** attempt); 
			}
		}
	}

	sendOtpEmail(to: string, otp: string) {
		return this.sendEmail({
			to,
			subject: 'Your verification code',
			html: otpEmailTemplate(otp),
			text: `Your verification code is: ${otp}`,
		});
	}
}
