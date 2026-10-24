import { Module } from '@nestjs/common';
import { EmailService } from './mail.service.js';

@Module({
	providers: [EmailService],
	exports: [EmailService], 
})
export class EmailModule {}
