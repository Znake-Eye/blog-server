import {
    JsonController,
    UseBefore,
    Param,
    Body,
    Get,
    Post,
    Put,
    Delete,
    Res,
    QueryParam
} from "routing-controllers";
import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { TUser } from "../types";
import { encryptPassword } from "../utils/encryptPassword";
import { resultStatus } from "../enums";
import { AuthMiddleware } from "../middleware/AuthMiddleware";

const prisma = new PrismaClient();

@JsonController("/users")
@UseBefore(AuthMiddleware)
export class UserController {

    @Get("/")
    async getAll(
        @QueryParam("pageSize") pageSize: number = 10, 
        @Res() response: Response
    ) {
        const allUsers = await prisma.user.findMany({
            where: { username: { not: 'root'}},
            select: {
                id: true,
                username: true,
                email: true,
                identify: true,
                status: true,
                createdAt: true
            }
        });
        return response.status(200).json({
            status: 'success',
            data: allUsers,
            pageSize: pageSize
        });
    }

    @Post("/")
    async createUser(
        @Body({ required : true}) user: TUser,
        @Res() response: Response
    ) {
        const { username, password, identify,email,status } = user;
        const hashedPassword = await encryptPassword(password || '');

        try {
            const existingData = await prisma.user.findUnique({
                where: {
                    username: username
                }
            });
            if (existingData) {
                return response.json({
                    status: resultStatus.FAILED,
                    message: "username already exist."
                });
            }
            await prisma.user.create({
                data: {
                    username,
                    email,
                    identify,
                    status,
                    password: hashedPassword
                }
            })
            return response.status(201).json({
                status: resultStatus.SUCCESS,
                message: 'User has created.',
            })

        } catch (error) {
            return response.status(500).json({
                status: resultStatus.FAILED,
                message: error,
            })
        }
    }

    @Get("/:id")
    async getUserById(@Param("id") id: number, @Res() res: Response) {
        
        try {
            const result = await prisma.user.findUnique({
                where: { id: id},
                select: {
                    id: true,
                    username: true,
                    identify: true,
                    email: true,
                    status: true,
                    createdAt: true
                }
            });
            
            return res.status(200).json({
                status: resultStatus.SUCCESS,
                data: result
            });
            
        } catch (error) {
            return res.status(500).json({
                status: resultStatus.FAILED,
                message: error
            })
        }
    }

    @Put("/:id")
    async updateUser(@Param("id") id: number, @Body() user: TUser, @Res() res: Response) {
        try {
            const { username, email, password, identify, status } = user;
            if(password) {
                const hashedPassword = await encryptPassword(password);
                await prisma.user.update({
                    where: { id },
                    data: {
                        username, email, identify, status,
                        password: hashedPassword
                    }
                })
            } else {
                await prisma.user.update({
                    where: { id },
                    data: {
                        username, email, identify, status
                    }
                })
            }
            return res.status(200).json({
                status: resultStatus.SUCCESS,
                message: 'User has updated',
            });
            
        } catch (error) {
            return res.status(500).send({
                status: resultStatus.FAILED,
                message: error
            });
        }
    }

    @Delete("/:id")
    async deleteUser(@Param("id") id: number, @Res() res: Response) {
        try {
            await prisma.user.delete({
                where: { id }
            })
            return res.status(200).json({
                status: resultStatus.SUCCESS,
                message: 'User has deleted.'
            });
        } catch (error) {
            return res.status(500).json({
                status: resultStatus.FAILED,
                message: error
            });
        }
    }
}