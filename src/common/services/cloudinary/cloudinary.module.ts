import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service.js';
import { CloudinaryProvider } from './cloudinary.provider.js';

@Module({
	providers: [CloudinaryService, CloudinaryProvider],
	exports: [CloudinaryService],
})
export class CloudinaryModule {}
