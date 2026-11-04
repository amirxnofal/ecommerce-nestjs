import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IImage } from '../../common/interfaces/image.interface.js';

@Schema({ _id: false })
export class Image implements IImage {
	@Prop({ type: String, required: true })
	public_id: string;

	@Prop({ type: String, required: true })
	secure_url: string;
}
export const ImageSchema = SchemaFactory.createForClass(Image);
