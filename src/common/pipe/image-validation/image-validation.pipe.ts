import {
	Injectable,
	PipeTransform,
	BadRequestException,
	UnsupportedMediaTypeException,
} from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
	async transform(file?: Express.Multer.File) {
		if (!file || !file.buffer?.length) {
			throw new BadRequestException('Image required');
		}

		const type = await fileTypeFromBuffer(file.buffer);

		if (
			!type ||
			!['image/jpeg', 'image/png'].includes(type.mime)
		) {
			throw new UnsupportedMediaTypeException(
				'only jpeg & png are supported',
			);
		}

		return file;
	}
}
