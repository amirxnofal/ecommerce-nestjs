import { UnsupportedMediaTypeException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export const imageUploadOptions: MulterOptions = {
	storage: memoryStorage(),
	fileFilter: (_req, file, cb) => {
		if (!/^image\/(png|jpeg|jpg)$/.test(file.mimetype)) {
			return cb(
				new UnsupportedMediaTypeException(
					'only jpeg & png are supported',
				),
				false,
			);
		}
		cb(null, true);
	},
	limits: { fileSize: 5 * 1024 * 1024 },
};
