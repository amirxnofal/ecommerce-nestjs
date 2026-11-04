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
		folder: string,
	): Promise<UploadApiResponse> {
		if (!file || file.size == 0)
			throw new BadRequestException('Image file is required');

		return new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				{ folder, resource_type: 'image' },
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
