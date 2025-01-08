import jwt from "jsonwebtoken";
import { UnauthorizedError } from "routing-controllers";
import { Socket } from "socket.io";
import { PrismaClient, User } from "@prisma/client";
const prisma = new PrismaClient();

const secretKey = process.env.JWT_SECRET;

export default async function socketAuthMiddleware(socket: Socket, next: (err?: any) => void) {
    try {
        const token = socket.handshake.headers.token as string;
        
        if (!token) {
            return next(new UnauthorizedError());
        }

        const decode: any =  jwt.verify(token, secretKey);

        const user = await prisma.user.findUnique({
            where: {
                id: decode?.id,
            },
            select: { id: true, currentToken: true },
        });

        if (!user || user.currentToken !== token) {
            console.log('unauthorize access');
            return next(new UnauthorizedError());
        }

        next();
    } catch (error) {
        console.log('error in socket middleware: ',error);
        return next(new UnauthorizedError("Unauthorized"));
    }
}