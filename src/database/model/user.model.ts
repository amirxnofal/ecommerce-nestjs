import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
	UserGender,
	UserProvider,
	UserRole,
	UserStatus,
} from '../../common/enums/user.enum.js';
import { HydratedDocument } from 'mongoose';
import { IUser } from '../../common/interfaces/user.interface.js';

@Schema()
export class User {
	@Prop({ type: String, required: true, trim: true })
	name: string;

	@Prop({
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
	})
	email: string;

	@Prop({ type: String, required: true, select: false })
	password: string;

	@Prop({ type: String, required: true })
	phone: string;

	@Prop({
		type: String,
		enum: UserProvider,
		default: UserProvider.LOCAL,
	})
	provider: UserProvider;

	@Prop({ type: String, enum: UserGender })
	gender: UserGender;

	@Prop({ type: String, enum: UserRole, default: UserRole.USER })
	role: UserRole;

	@Prop({ type: Boolean, default: false })
	isVerified: boolean;

	@Prop({ type: String, enum: UserStatus, default: UserStatus.INACTIVE })
	status: boolean;
}

export type UserDocument = HydratedDocument<IUser>;

export const userSchema = SchemaFactory.createForClass(User);

userSchema.set('toJSON', {
	transform: (_doc, ret) => {
		const { password: _password, ...safe } = ret;
		return safe;
	},
});

export const UserModel = MongooseModule.forFeature([
	{ name: User.name, schema: userSchema },
]);
