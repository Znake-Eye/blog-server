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
    QueryParam,
    CurrentUser
} from "routing-controllers";
import { Response } from "express";
import { User } from "@prisma/client";
import prisma from "../../prisma";
import { TUser } from "../types";
import { encryptPassword } from "../utils/encryptPassword";
import { resultStatus } from "../enums";
import { AuthMiddleware } from "../middleware/AuthMiddleware";

import * as nodeMailer from "nodemailer";
import Joi from "joi";

const sendGmailSchema = Joi.object({
    to: Joi.string().required(),
    subject: Joi.string().optional(),
    text: Joi.string().optional()
})

type TSendMessageGmail = {
    to: string;
    subject: string;
    text: string;
}

@JsonController("/users")
@UseBefore(AuthMiddleware)
export class UserController {

    @Get("/")
    async getAll(
        @QueryParam("pageSize") pageSize: number = 10, 
        @Res() response: Response,
        @CurrentUser() user: User,
    ) {
        const allUsers = await prisma.user.findMany({
            where: {
                AND: [
                    { username: { not: 'root'}, },
                    { id: { not: user?.id } }
                ]
            },
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

    @Post("/send_gmail")
    async sendMessageToGmail(@Body({ required: true }) req: TSendMessageGmail, @Res() res: Response) {
        
        const { error }= sendGmailSchema.validate(req);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message})
        }

        const { to: receiver, subject, text } = req;

        const transporter = nodeMailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SENDER_EMAIL,
                pass: process.env.APP_PASSWORD,
            }
        });

        const htmlContent = `<h1 style="color: green">Hello!</h1>
                            <p style="font-size: 18px">This is an email with <b>HTML</b> content.</p>
                            <a href="http://vichhaiblog.online/">click to visit our website</a>`;

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: receiver,
            subject: subject || 'This is testing subject',
            // text: text || 'This is testing text',
            html: htmlContent
        }

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email send: ', info.response);
            return res.status(200).json({ success: true, message: 'Email sent successfully', info});
        } catch (error) {
            console.log('failed to send mail: ', error);
            return res.status(500).json({ message: 'Cannot send mail', error});
        }
    }
}