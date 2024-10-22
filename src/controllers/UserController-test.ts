import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const createUser = async (req: any, res: any) => {
    const { 
        username,
        identify,
        email,
        password,
        status,
    } = req.body;
    try {
        const result = await prisma.user.upsert({
            where: {username: username},
            update: {},
            create: {
                username: username,
                identify: identify || '',
                email: email || '',
                password: password,
                status: status
            }
        });
        if(result) {
            res.status(200).json({
                status : true,
                message: 'User has created!'
            })
        }
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error
        });
    }
};

export { createUser };
