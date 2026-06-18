import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    // Placeholder summary for the school-management shell. Build out the real
    // metrics (students, attendance, fees, etc.) as those modules are added.
    async summary() {
        const [users, unreadNotifications] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.notification.count({ where: { read: false } }),
        ]);

        return {
            users,
            unreadNotifications,
        };
    }
}
