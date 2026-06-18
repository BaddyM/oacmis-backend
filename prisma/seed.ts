// prisma/seed.ts — minimal seed for the OACMIS school-management shell.
// Creates a single active admin user so you can log in and start building.
import { PrismaClient, UserRole } from '@prisma/client';
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@oacmis.local';
    const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log(`Admin user already exists: ${email}`);
        return;
    }

    const user = await prisma.user.create({
        data: {
            name: 'Administrator',
            email,
            password: await bcrypt.hash(password, 10),
            role: UserRole.admin,
            isActive: true,
        },
    });
    console.log(`Created admin user: ${user.email} (password: ${password})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
