import { Injectable, BadRequestException } from '@nestjs/common';
import {
	v2 as cloudinary,
	UploadApiResponse,
	UploadApiErrorResponse,
} from 'cloudinary';

@Injectable()
export class CloudinaryService {
	//* <--- Upload image --->
	uploadFile(
		file: Express.Multer.File,
		folder = 'uploads',
	): Promise<UploadApiResponse> {
		return new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				{ folder, resource_type: 'auto' },
				(
					error?: UploadApiErrorResponse,
					result?: UploadApiResponse,
				) => {
					if (error || !result) {
						return reject(
							new BadRequestException(
								error?.message || 'Upload failed',
							),
						);
					}
					resolve(result);
				},
			);
			stream.end(file.buffer);
		});
	}

	//* <--- Delete image --->
	async deleteFile(publicId: string) {
		return cloudinary.uploader.destroy(publicId);
	}
}
