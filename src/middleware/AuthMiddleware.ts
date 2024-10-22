
import * as jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const secretKey = process.env.JWT_SECRET || '';

const authMiddleware = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send({
            message: 'Authorization toke is missing formatted'
        });
    }

    const requestToken = authHeader.split(" ")[1];
    if(!requestToken) {
        res.status(401).send({
            message: 'Unauthorized'
        });
    }

    try {
        const decode: any = jwt.verify(requestToken, secretKey);
        const user = await prisma.user.findUnique({
            where: { id: decode?.id},
            select: {
                id: true,
                username: true,
                currentToken: true
            }
        })

        if(!user || user.currentToken !== requestToken) {
            return res.status(401).send({
                message: 'Unauthorized to access'
            });
        }
        console.log('Authorized to access');
        console.log(decode);
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            message: 'Unauthorized access'
        })
    }

};

export { authMiddleware };