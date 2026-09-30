import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { Cache } from "cache-manager";
import { time } from 'console';
import { randomBytes } from 'crypto';
const bcrypt = require("bcryptjs");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService,
        private userService: UserService,
        private jwtService: JwtService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    /**
     * Sign in with an email address (staff) or a student number (pupils).
     * The parameter is still called `identifier` rather than `email` because a
     * pupil's credential is their student number — resolved through the User →
     * Student link rather than a second copy of the number on the user row.
     */
    async login(identifier: string, password: string) {
        try {
            const login = `${identifier ?? ''}`.trim();

            const account = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: login },
                        { student: { studentNumber: login } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    password: true,
                    role: true,
                    isActive: true,
                    permissions: true,
                    lockedUntil: true,
                    failedLoginCount: true,
                    accessToken: true,
                    student: { select: { studentNumber: true } },
                },
            });

            // Same message whether the account is missing or the password is
            // wrong, so the endpoint cannot be used to enumerate student numbers.
            if (!account) throw new UnauthorizedException("User not authorized");

            if (account.lockedUntil && account.lockedUntil > new Date()) {
                throw new UnauthorizedException(
                    `Account is locked until ${account.lockedUntil.toISOString()}. Try again later or reset your password.`,
                );
            }

            const valid: boolean = await bcrypt.compare(`${password}`, account.password);
            if (!valid) {
                const newCount = (account.failedLoginCount ?? 0) + 1;
                const willLock = newCount >= MAX_FAILED_ATTEMPTS;
                await this.prisma.user.update({
                    where: { id: account.id },
                    data: {
                        failedLoginCount: newCount,
                        lockedUntil: willLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
                    },
                });
                throw new UnauthorizedException("User not authorized");
            }

            if (!account.isActive) {
                throw new UnauthorizedException("Account is inactive or not found");
            }

            const accessToken = this.jwtService.sign(
                { email: account.email },
                { secret: process.env.SYSTEM_SECRET, expiresIn: '24hr' },
            );

            // Drop the session cached against the previous token.
            if (account.accessToken) {
                await this.cacheManager.del(`auth_session:${account.accessToken}`);
            }

            const user = await this.prisma.user.update({
                where: { id: account.id },
                data: { accessToken, failedLoginCount: 0, lockedUntil: null },
            });

            //Add new token in cache — store the {id, role, permissions} shape that AuthGuard expects on request.user
            await this.cacheManager.set(
                `auth_session:${accessToken}`,
                { id: user.id, role: user.role, permissions: user.permissions ?? null },
                300000,
            ); //Cache set for 5 minutes

            await this.prisma.loginAccess.create({ data: { userId: user.id } });

            const studentNumber = account.student?.studentNumber ?? null;

            return {
                accessToken,
                role: user.role,
                userId: user.id,
                name: user.name,
                isActive: user.isActive,
                email: user.email,
                permissions: user.permissions ?? null,
                isSystemOwner: user.isSystemOwner,
                studentNumber,
                // A pupil who has never changed their password is still using
                // their student number as one; the portal nudges them to change it.
                usingDefaultPassword: studentNumber
                    ? await bcrypt.compare(studentNumber, account.password)
                    : false,
            };
        } catch (e) {
            // If it's already a NestJS defined error (401, 403, 404), just re-throw it
            if (e instanceof UnauthorizedException || e instanceof HttpException) {
                throw e;
            }

            // Only log and 500 on REAL system crashes (Database down, code bugs)
            if (process.env.MODE === "Dev") {
                console.error("[Login Error]:", e);
            }

            throw new InternalServerErrorException("Failed to login the user");
        }
    }

    /**
     * Let a signed-in user change their own password. Pupils start on their
     * student number as a password, so this is the route that gets them off it.
     * The school's password policy applies here exactly as it does to an admin
     * setting someone's password.
     */
    async change_password(userId: string, currentPassword: string, newPassword: string) {
        const account = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true, accessToken: true },
        });
        if (!account) throw new UnauthorizedException('Account not found');

        const valid: boolean = await bcrypt.compare(`${currentPassword}`, account.password);
        if (!valid) throw new BadRequestException('Your current password is incorrect');

        if (`${currentPassword}` === `${newPassword}`) {
            throw new BadRequestException('The new password must be different from the current one');
        }

        await this.userService.validatePassword(newPassword);
        await this.prisma.user.update({
            where: { id: account.id },
            data: {
                password: await bcrypt.hash(`${newPassword}`, 10),
                failedLoginCount: 0,
                lockedUntil: null,
            },
        });

        return { ok: true };
    }

    async logout(userId: string) {
        const data = await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                accessToken: null,
            },
            select: {
                name: true,
                email: true,
                accessToken: true,
            }
        });
        return data;
    }

    //Password Reset
    async request_password_reset(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        // Always succeed silently to avoid leaking which emails exist
        if (!user) return { ok: true };

        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
        await this.prisma.passwordResetToken.create({
            data: { userId: user.id, token, expiresAt },
        });
        // TODO: send email via configured mailer.
        if (process.env.MODE === 'Dev') {
            console.log(`[password-reset] token for ${email}: ${token}`);
        }
        return { ok: true, devToken: process.env.MODE === 'Dev' ? token : undefined };
    }

    async reset_password(token: string, newPassword: string) {
        if (!newPassword || newPassword.length < 6) {
            throw new BadRequestException('Password must be at least 6 characters');
        }
        const record = await this.prisma.passwordResetToken.findUnique({
            where: { token },
        });
        if (!record || record.usedAt || record.expiresAt < new Date()) {
            throw new BadRequestException('Invalid or expired reset token');
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: record.userId },
                data: {
                    password: hashed,
                    failedLoginCount: 0,
                    lockedUntil: null,
                },
            }),
            this.prisma.passwordResetToken.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            }),
        ]);
        return { ok: true };
    }

    async unlock_user(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { failedLoginCount: 0, lockedUntil: null },
        });
    }
}
