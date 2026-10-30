import { Types } from 'mongoose';
import { IImage } from './image.interface.js';

export interface ISubCategory {
	_id: Types.ObjectId | string;
	name: string;
	slug: string;
	description?: string;
	subCategoryImage?: IImage;
	category: Types.ObjectId | string;
	createdBy: Types.ObjectId | string;
	deletedAt?: Date | null;
	createdAt?: Date;
	updatedAt?: Date;
}
