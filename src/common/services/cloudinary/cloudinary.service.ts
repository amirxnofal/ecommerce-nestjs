import { Injectable, BadRequestException } from '@nestjs/common';
import {
	v2 as cloudinary,
	UploadApiResponse,
	UploadApiErrorResponse,
} from 'cloudinary';
import { IImage } from '../../interfaces/image.interface.js';

export type FailedUpload = { originalName: string; reason: string };
@Injectable()
export class CloudinaryService {
	//* <--- Upload single image --->
	uploadFile(file: Express.Multer.File, folder: string): Promise<IImage> {
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
					resolve({
						secure_url: result.secure_url,
						public_id: result.public_id,
					});
				},
			);
			stream.end(file.buffer);
		});
	}

	//* <--- Upload many (partial success) --->
	async uploadManyFiles(
		files: Express.Multer.File[],
		folder: string,
	): Promise<{ uploaded: IImage[]; failed: FailedUpload[] }> {
		const results = await Promise.allSettled(
			files.map((file) => this.uploadFile(file, folder)),
		);

		const uploaded: IImage[] = [];
		const failed: FailedUpload[] = [];

		results.forEach((result, i) => {
			if (result.status === 'fulfilled') {
				uploaded.push(result.value);
			} else {
				failed.push({
					originalName: files[i].originalname,
					reason: result.reason?.message ?? 'Upload failed',
				});
			}
		});

		return { uploaded, failed };
	}

	//* <--- Delete single image --->
	async deleteFile(publicId: string): Promise<void> {
		await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
	}

	//* <--- Delete many images --->
	async deleteMany(publicIds: string[]): Promise<void> {
		if (!publicIds.length) return;

		await cloudinary.api.delete_resources(publicIds, {
			resource_type: 'image',
		});
	}
}
