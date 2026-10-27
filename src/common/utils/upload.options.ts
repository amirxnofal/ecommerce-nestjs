import { UnsupportedMediaTypeException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage, memoryStorage } from 'multer';

export const imageUploadOptions: MulterOptions = {
	storage: diskStorage({
		destination: './uploads',
		filename: (_req, file, cb) => {
			const uniqueSuffix =
				Date.now() + '-' + Math.round(Math.random() * 1e9);
			const extension = file.originalname.split('.').pop();
			cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`);
		},
	}),
	fileFilter: (_req, file, cb) => {
		if (!/^image\/(png|jpeg)$/.test(file.mimetype)) {
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
