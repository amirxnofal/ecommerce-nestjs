import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck(): { status: string; message: string } {
    return { status: 'Ok', message: 'Server in healthy...' };
  }
}
