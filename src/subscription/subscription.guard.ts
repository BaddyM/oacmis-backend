import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubscriptionService } from './subscription.service';

// Requests that stay possible while the system is read-only: signing in and
// out, recovering an account, a user's own theme, and the owner's subscription
// screen (which checks for the owner itself).
const ALWAYS_ALLOWED: RegExp[] = [
    /^\/auth\/login\/?$/,
    /^\/auth\/me\/password\/?$/,
    /^\/auth\/password-reset\//,
    /^\/auth\/user\/[^/]+\/unlock\/?$/,
    /^\/me\/preferences\/?$/,
    /^\/subscription(\/|$)/,
];

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Global guard: when no subscription is in force the whole API becomes
 * read-only. Every non-read request is refused — which also covers server-side
 * PDF downloads (POST /pdf). The Administrator (system owner) account is
 * exempt so it can always fix things.
 *
 * Registered as APP_GUARD, so it runs before the controller-level AuthGuard;
 * it therefore reads the bearer token itself rather than relying on req.user.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(
        private readonly subscriptions: SubscriptionService,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (context.getType() !== 'http') return true;
        const req = context.switchToHttp().getRequest();
        if (READ_METHODS.has(String(req.method).toUpperCase())) return true;

        const path = String(req.path ?? req.url ?? '').split('?')[0];
        if (ALWAYS_ALLOWED.some((re) => re.test(path))) return true;

        const status = await this.subscriptions.status();
        if (status.active) return true;
        if (await this.isOwner(req)) return true;

        throw new ForbiddenException({
            statusCode: 403,
            reason: 'SUBSCRIPTION_INACTIVE',
            state: status.state,
            message:
                status.state === 'revoked'
                    ? 'The subscription has been revoked. The system is read-only.'
                    : 'The subscription has expired. The system is read-only until it is renewed.',
        });
    }

    private async isOwner(req: { headers?: Record<string, string | undefined> }) {
        const [type, token] = req.headers?.authorization?.split(' ') ?? [];
        if (type !== 'Bearer' || !token) return false;
        const user = await this.prisma.user.findFirst({
            where: { accessToken: token, isActive: true },
            select: { isSystemOwner: true },
        });
        return !!user?.isSystemOwner;
    }
}
