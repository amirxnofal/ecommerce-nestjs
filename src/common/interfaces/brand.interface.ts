import { Types } from 'mongoose';
import { IImage } from './image.interface.js';

export interface IBrand {
	_id: Types.ObjectId;
	name: string;
	slug: string;
	image: IImage;
	createdBy: Types.ObjectId | string;
	updatedBy: Types.ObjectId | string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date;
	restoredAt: Date;
}
