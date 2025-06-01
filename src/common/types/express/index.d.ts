import { UserType } from 'src/common/types/enums/user.enum';

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        role: UserType;
        // Add other JWT payload properties if any
      };
    }
  }
}
