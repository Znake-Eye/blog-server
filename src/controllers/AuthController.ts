import {
    Body,
    JsonController,
    Post,
    Res,
} from "routing-controllers";
import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";
import bcrypt from "bcrypt";
import auth from "../utils/Auth";
import { resultStatus } from "../enums";
import { encryptPassword } from "../utils/encryptPassword";

const schema = Joi.object({
    username: Joi.string().min(3).required(),
    password: Joi.string().min(3).required()
})
const prisma = new PrismaClient();

@JsonController("/user")
export class AuthController {

    @Post("/login")
    async login(@Body({ required: true}) credentials: {username: string, password: string}, @Res() res: Response) {
        
        const { username, password } = credentials;
        try {
            const {error, value} = schema.validate(credentials);
            if(error) {
                return res.status(400).json({
                    message: error.details[0].message
                })
            }

            const user = await prisma.user.findUnique({
                where: {username}
            })

            if(!user) {
                return res.status(400).send({
                    message: 'User not found!'
                });
            }

            const comparePassword = await bcrypt.compare(password, user?.password);
            if(!comparePassword) {
                return res.status(400).send({
                    message: 'Invalid password. please check again!',
                })
            }

            const accessToken = auth.createAccessToken(user.id, user.username);

            await prisma.user.update({
                where: { id: user.id },
                data: {currentToken: accessToken}
            });

            const data = {
                id: user.id,
                username: user.username,
            }

            return res.status(200).json({
                status: resultStatus.SUCCESS,
                accessToken: accessToken,
                user: data
            });

        } catch (error) {
            return res.status(500).send(error);
        }
    }

    @Post('/signup')
    async createUserAccount(@Body({ required: true }) req: {username: string, password: string}, @Res() res: Response) {
        const { username, password } = req;
        try {
            const { error } = schema.validate(req);
            if(error) {
                return res.status(400).json({
                    message: error.details[0].message
                })
            }
            const user = await prisma.user.findUnique({
                where: {username}
            });
            if(user) {
                return res.status(400).json({
                    message: 'User already exist!',
                });
            }

            const hashedPassword = await encryptPassword(password);
            const createUser = await prisma.user.create({
                data: {
                    username: username,
                    password: hashedPassword,
                }
            });
            const token = auth.createAccessToken(createUser.id, createUser.username);
            const updateUser = await prisma.user.update({
                where: {id: createUser.id},
                data: {currentToken: token}
            });

            const data = {
                id: updateUser.id,
                username: updateUser.username,
            }

            return res.status(200).json({
                status: resultStatus.SUCCESS,
                accessToken: token,
                user: data
            });

        } catch (error) {
            return res.status(400).json({
                message: error
            });
        }
    }



}