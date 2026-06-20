import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Restrict a route (or controller) to specific user roles. Used together with
// RolesGuard, which reads this metadata. No metadata => no role restriction.
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
