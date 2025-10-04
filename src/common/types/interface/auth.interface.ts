import type { UserType } from '../enums/user.enum';

export interface IssueTokenPayload {
  sub: string;
  role: UserType;
  userId?: string;
  anchorId?: string;
}
