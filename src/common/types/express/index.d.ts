import type { AuthenticatedUser } from 'src/common/types/request.types';

declare global {
  namespace Express {
    interface Request {
      user: AuthenticatedUser;
    }
  }
}
