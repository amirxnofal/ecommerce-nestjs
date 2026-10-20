import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    console.log('BEFORE CONTROLLER');
    const now = Date.now();

    return next.handle().pipe(
      /*tap(() => {
        console.log(
          `AFTER CONTROLLER : execution time of request is ${Date.now() - now}`,
        );
      }), //  to calculate response time ,
      */
      map((data) => {
        return {
          iGhost: 'amirxnofal',
          ZigZog: data,
        };
      }), //  to reshape data,
    );
  }
}
