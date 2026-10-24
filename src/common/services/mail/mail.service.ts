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
}

@Injectable()
export class EmailService implements OnModuleInit {
	private readonly logger = new Logger(EmailService.name);

	private readonly transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: env.googleAppEmail,
			pass: env.googleAppPassword,
		},
	});

	async onModuleInit() {
		await this.transporter.verify();
		this.logger.log('Email service connected');
	}

	async sendEmail(
		{ to, subject, html }: SendEmailOptions,
		retries = 2,
	): Promise<void> {
		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				const info = await this.transporter.sendMail({
					from: env.emailSenderName,
					to,
					subject,
					html,
				});
				this.logger.log(`Email sent to: ${info.accepted.join(', ')}`);
				return;
			} catch (error) {
				this.logger.warn(
					`Send failed (attempt ${attempt + 1}/${retries + 1})`,
				);
				if (attempt === retries) {
					this.logger.error(
						'Failed to send email after retries',
						error,
					);
					throw new ServiceUnavailableException(
						'Failed to send email',
					);
				}
			}
		}
	}

	sendOtpEmail(to: string, otp: string) {
		return this.sendEmail({
			to,
			subject: 'Your verification code',
			html: otpEmailTemplate(otp),
		});
	}
}
