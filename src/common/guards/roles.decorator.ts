import { SetMetadata } from '@nestjs/common';
import { UserType } from 'src/common/types/enums/user.enum';

export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);
