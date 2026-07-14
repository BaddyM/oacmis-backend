import { NotFoundException } from '@nestjs/common';
import { BaseCrudService } from './base-crud.service';
import { AuthUser } from './authed-request';

/**
 * BaseCrudService for records that belong to the user who created them.
 *
 * Roles in `ownerScopedRoles` are confined to rows whose `userId` matches their
 * own; every other role keeps the unfiltered view. Scoping is opt-in per role
 * rather than "everyone but admin" on purpose: a quiz is authored by a teacher
 * but *sat* by a student, so students must still read the full published list.
 *
 * The filter lives in the service rather than the page, so it holds for anyone
 * calling the API directly. Rows with a null `userId` (created before ownership
 * existed) have no owner and so are invisible to owner-scoped roles.
 *
 * `userId` is always taken from the verified JWT, never from the request body.
 */
export abstract class OwnedCrudService extends BaseCrudService {
    // Roles confined to their own rows. Everyone else is unaffected.
    protected ownerScopedRoles = ['teacher'];
    // Fields only an unscoped role may set. Stripped from an owner-scoped
    // caller's payload, so e.g. a teacher can't approve their own leave request
    // by calling PATCH directly even though the UI hides the button.
    protected privilegedFields: string[] = ['userId'];

    protected isOwnerScoped(user: AuthUser) {
        return this.ownerScopedRoles.includes(user.role);
    }

    async createOwned(data: any, user: AuthUser) {
        const safe = { ...(data ?? {}) };
        if (this.isOwnerScoped(user)) {
            for (const field of this.privilegedFields) delete safe[field];
        }
        // Ownership always follows the token, never the body.
        return super.create({ ...safe, userId: user.id });
    }

    async findAllOwned(
        user: AuthUser,
        page = 1,
        limit = this.defaultLimit,
        search?: string,
        term?: string,
        year?: number,
    ) {
        if (!this.isOwnerScoped(user)) return super.findAll(page, limit, search, term, year);

        // Re-derive the base filter, then AND the ownership constraint onto it.
        const where = { AND: [this.buildWhere(search, term, year), { userId: user.id }] };
        const [data, total] = (await this.prisma.$transaction([
            this.delegate.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.delegate.count({ where }),
        ] as any)) as [any[], number];
        return { data, total, totalPages: Math.ceil(total / limit) };
    }

    async findOneOwned(id: string, user: AuthUser) {
        const record = await super.findOne(id);
        this.assertOwner(record, user);
        return record;
    }

    async updateOwned(id: string, data: any, user: AuthUser) {
        this.assertOwner(await super.findOne(id), user);
        if (!this.isOwnerScoped(user)) return super.update(id, data);

        const safe = { ...(data ?? {}) };
        for (const field of this.privilegedFields) delete safe[field];
        return super.update(id, safe);
    }

    async removeOwned(id: string, user: AuthUser) {
        this.assertOwner(await super.findOne(id), user);
        return super.remove(id);
    }

    // 404 rather than 403 for a non-owner: a teacher probing ids shouldn't be
    // able to tell "exists but isn't yours" apart from "doesn't exist".
    private assertOwner(record: any, user: AuthUser) {
        if (!this.isOwnerScoped(user)) return;
        if (!record.userId || record.userId !== user.id) {
            throw new NotFoundException(`${this.entity} not found`);
        }
    }
}
