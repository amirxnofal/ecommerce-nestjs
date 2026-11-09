import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

@ArgsType()
export class PaginationArgs {
	@Field(() => Int, { defaultValue: 1, nullable: true })
	@IsOptional()
	@IsInt()
	@Min(1)
	page: number;

	@Field(() => Int, { defaultValue: 10, nullable: true })
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	limit: number;
}
