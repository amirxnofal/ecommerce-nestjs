import { Reflector } from '@nestjs/core';
import { UserRole } from '../../enums/user.enum.js';

export const Roles = Reflector.createDecorator<UserRole[]>();
