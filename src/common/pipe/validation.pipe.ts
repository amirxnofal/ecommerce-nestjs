import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}
  transform(value: any, metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);

    if (!result.success)
      throw new BadRequestException({
        message: 'validation error',
        cause: {
          extra: result.error.issues,
        },
      });

    return value;
  }
}
