import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StudentBalanceService } from 'src/common/student-balance.service';
import { REQUIRES_CLEARED_FEES } from './requires-cleared-fees.decorator';

/**
 * Withholds a section from a pupil who still owes fees.
 *
 * Only ever acts on `student` logins: teachers and admins reach the same
 * endpoints to set the work, and must not be affected. A student login with no
 * pupil record attached has no fees to owe, so it passes too.
 *
 * The 403 body carries the outstanding amount so the client can show the pupil
 * what is owed rather than a bare "forbidden".
 */
@Injectable()
export class FeesClearedGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly balances: StudentBalanceService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const gated = this.reflector.getAllAndOverride<boolean>(REQUIRES_CLEARED_FEES, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!gated) return true;

        const user = context.switchToHttp().getRequest().user;
        if (!user || user.role !== 'student') return true;

        const state = await this.balances.forUser(user.id);
        if (!state || state.summary.cleared) return true;

        throw new ForbiddenException({
            statusCode: 403,
            reason: 'FEES_OUTSTANDING',
            outstanding: state.summary.outstanding,
            message: 'This section is on hold until your fee balance is cleared',
        });
    }
}
