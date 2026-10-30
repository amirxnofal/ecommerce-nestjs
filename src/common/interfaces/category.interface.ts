import { Types } from 'mongoose';
import { IImage } from './image.interface.js';

export interface ICategory {
	_id: Types.ObjectId | string;
	name: string;
	slug: string;
	description?: string;
	categoryImage?: IImage;
	createdBy: Types.ObjectId | string;
	deletedAt?: Date | null;
	createdAt?: Date;
	updatedAt?: Date;
}

