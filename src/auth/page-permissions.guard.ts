import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_PAGE_KEY } from './requires-page.decorator';
import { resolveAllowedPages } from './page-access';

/**
 * Authorization by page access. Where RolesGuard asks "is this user an admin?",
 * this asks "can this user open a screen that needs this data?" — so a per-user
 * permission override an admin set on the Users page is enforced server-side,
 * not just hidden in the UI.
 *
 * Runs after AuthGuard, which puts { id, role, permissions } on request.user.
 */
@Injectable()
export class PagePermissionsGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<string[]>(REQUIRES_PAGE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required || required.length === 0) return true; // unrestricted

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            // Only reachable if a route is decorated but not wrapped in AuthGuard.
            throw new ForbiddenException('You do not have permission to perform this action');
        }

        const allowed = resolveAllowedPages(user.role, user.permissions);
        if (required.some((page) => allowed.has(page))) return true;

        throw new ForbiddenException('You do not have access to this section');
    }
}
