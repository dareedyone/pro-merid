import { SetMetadata } from '@nestjs/common';
import type { UserType } from 'src/common/types/enums/user.enum';

export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);
