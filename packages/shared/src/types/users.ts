/**
 * Shared types for users
 */

export interface User {
  id: string;
  name?: string;
  email?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  name?: string;
  email?: string;
  isAnonymous?: boolean;
}
