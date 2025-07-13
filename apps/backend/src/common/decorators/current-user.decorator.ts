import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../types';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  }
);
