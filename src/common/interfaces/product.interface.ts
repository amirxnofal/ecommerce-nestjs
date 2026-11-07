import { Types } from 'mongoose';
import { IImage } from './image.interface.js';

export interface IProduct {
	_id: Types.ObjectId;
	productId: string;
	name: string;
	description?: string;
	slug: string;
	image: IImage;
	gallery: IImage[];
	stock: number;
	rating: number;
	originalPrice: number;
	discountPercentage: number;
	salePrice: number;
	category: Types.ObjectId | string;
	subCategory: Types.ObjectId | string;
	brand: Types.ObjectId | string;
	createdBy: Types.ObjectId | string;
	updatedBy?: Types.ObjectId | string;
	deletedAt?: Date | null;
	restoredAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}
