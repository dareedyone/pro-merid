import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from 'src/common/types/enums/user.enum';
import { RequestWithUser } from 'src/common/types/request.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const allowedRoles = this.reflector.get<UserType[]>(
      'roles',
      context.getHandler(),
    );

    if (!allowedRoles) return true;

    const user = request.user;

    if (!user || !allowedRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    this.validateUserIds(user);

    return true;
  }

  private validateUserIds(user: any): void {
    const { role, userId, anchorId } = user;

    switch (role) {
      case UserType.USER:
        if (!userId) {
          throw new BadRequestException('User ID is required for user role');
        }
        break;

      case UserType.ANCHOR:
        if (!anchorId) {
          throw new BadRequestException(
            'Anchor ID is required for anchor role',
          );
        }
        break;

      case UserType.ADMIN:
      case UserType.SUPPORT:
        // Admins and support can have either userId or anchorId depending on context
        // No strict validation needed as they can access multiple resources
        break;

      default:
        throw new ForbiddenException(`Unknown user role: ${role}`);
    }
  }
}
