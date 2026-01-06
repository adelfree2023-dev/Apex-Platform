import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route as public (no JWT required)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';

/**
 * Decorator to require specific roles
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
