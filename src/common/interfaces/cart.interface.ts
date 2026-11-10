import { Types } from 'mongoose';

export interface ICart {
	createdBy: Types.ObjectId ;
	items: ICartItem[];
	createdAt: Date;
	updatedAt: Date;
}

export interface ICartItem {
	product: Types.ObjectId ;
	quantity: number;
}
