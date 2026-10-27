import { Types } from 'mongoose';

export interface IBrand {
	name: string;
	slug: string;
	image: string;
	createdBy: Types.ObjectId | string;
	updatedBy: Types.ObjectId | string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date;
	restoredAt: Date;
}
