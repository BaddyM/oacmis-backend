import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

// Authorization guard. Runs after AuthGuard (which sets request.user) and checks
// the user's role against any @Roles(...) metadata on the handler/controller.
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required || required.length === 0) return true; // unrestricted

        const request = context.switchToHttp().getRequest();
        const role = request.user?.role;
        if (!role || !required.includes(role)) {
            throw new ForbiddenException('You do not have permission to perform this action');
        }
        return true;
    }
}
