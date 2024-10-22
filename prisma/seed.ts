import { 
    PrismaClient,
    RoleType,
    UserStatus,
} from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();

async function main() {
    const password = 'Admin@password';
    const hashedPassword = await bcrypt.hash(password, 10);
    const userPassword = 'User@password';
    const userHashedPassword = await bcrypt.hash(userPassword, 10);
    const categories = [
        { name: 'Entertainment' },
        { name: 'Sport' },
        { name: 'Technology' },
        { name: 'Science' },
        { name: 'Country size'},
        { name: 'River'},
        { name: 'Relaxing' },
        { name: 'Travelling'},
        { name: "Coding with coffee"}
    ];

    await Promise.all([
        prisma.user.upsert({
            where: { username: 'root' },
            update: {},
            create: {
                username: 'root',
                password: hashedPassword,
                status: UserStatus.SYSTEM,
                roleType: RoleType.ADMIN
            } 
        }),
        prisma.user.upsert({
            where: { username: 'user' },
            update: {},
            create: {
                username: 'user',
                password: userHashedPassword,
                status: UserStatus.ACTIVE,
                roleType: RoleType.USER
            } 
        }),
        prisma.category.createMany({
            data: categories,
            skipDuplicates: true
        })
    ])

};

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.log(e);
        await prisma.$disconnect()
        process.exit(1)
    });