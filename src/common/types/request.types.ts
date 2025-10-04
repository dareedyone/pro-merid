import type { Request } from 'express';
import type { IssueTokenPayload } from './interface/auth.interface';

export type AuthenticatedUser = IssueTokenPayload;

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
