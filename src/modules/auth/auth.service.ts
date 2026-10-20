import { Injectable, Post } from '@nestjs/common';

@Injectable()
export class AuthService {
  register(data:any): object {
    return { message: 'user registered', user: data };
  }
}
