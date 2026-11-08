import {
	registerDecorator,
	ValidationArguments,
	ValidationOptions,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'CheckPriceSale', async: false })
export class CheckPriceSale implements ValidatorConstraintInterface {
	validate(
		value: number,
		args?: ValidationArguments,
	): Promise<boolean> | boolean {
		const originalPrice = (args?.object as any)[
			args?.constraints[0] as string
		];
		return Number(value) <= Number(originalPrice);
	}

	defaultMessage(validationArguments?: ValidationArguments): string {
		return 'Sale price must be less than original price';
	}
}

export function IsGte(
	constraints: string[] = [],
	validationOptions?: ValidationOptions,
) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'IsGte',
			target: object.constructor,
			propertyName: propertyName,
			constraints: constraints,
			options: validationOptions,
			validator: CheckPriceSale,
		});
	};
}
