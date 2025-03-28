import {
    Body,
    JsonController,
    Post,
    Get,
    Res,
    UnauthorizedError,
    UseBefore,
} from "routing-controllers";
import { Response } from "express";
import prisma from "../../prisma";
import Joi from "joi";
import bcrypt from "bcrypt";
import auth from "../utils/Auth";
import { resultStatus } from "../enums";
import { encryptPassword } from "../utils/encryptPassword";
import { authLimiter } from "../middleware/Limiter";

const schema = Joi.object({
    username: Joi.string().min(3).required(),
    password: Joi.string().min(3).required()
});

const createUserSchema = Joi.object({
    username: Joi.string().min(3).required(),
    password: Joi.string().min(3).required(),
    email: Joi.string().optional(),
    phone: Joi.string().optional(),
});

@JsonController("/user")
@UseBefore(authLimiter)
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

            const accessToken = auth.createAccessToken(user.id, user.username, user.roleType);

            await prisma.user.update({
                where: { id: user.id },
                data: {currentToken: accessToken}
            });

            const data = {
                id: user.id,
                username: user.username,
                roleType: user.roleType,
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
    async createUserAccount(
        @Body({ required: true }) 
            req: {
                username: string, password: string,
                email: string,
                phone: string,
            }, 
        @Res() res: Response
    ) {
        const { username, password, email, phone } = req;
        try {
            const { error } = createUserSchema.validate(req);
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
                    ...(email && { email: email }),
                    ...(phone && { phone: phone })
                }
            });
            const token = auth.createAccessToken(createUser.id, createUser.username, createUser.roleType);
            const updateUser = await prisma.user.update({
                where: {id: createUser.id},
                data: {currentToken: token}
            });

            const data = {
                id: updateUser.id,
                username: updateUser.username,
                roleType: updateUser.roleType,
                email: email || '',
                phone: phone || ''
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

    @Get('/something')
    doSomething(@Res() res: Response) {
        console.log('do something controller');
        // throw new NotFoundError('rout not found');
        throw new UnauthorizedError('cannot access to data');
        // throw new Error('Hello world');
        // return res.json({
        //     data: 'Hello world'
        // })
    }

}