import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export interface RequestWithContext extends Request {
  requestId?: string;
  user?: AuthenticatedUser;
}
