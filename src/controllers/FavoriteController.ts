import { Response } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { JsonController, Post, UseBefore, Get, Res, Body, CurrentUser } from "routing-controllers";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import Joi from "joi";
import { TUser } from "../types";

const createSchema = Joi.object({
    productId: Joi.number().required()
});

@JsonController('/favorite')
@UseBefore(AuthMiddleware)
export class CategoryController {

    @Get('/')
    async getFavorite(@CurrentUser() user: TUser ,@Res() res: Response) {
        try {
            const data = await prisma.favorite.findMany({
                where: {
                    userId: user.id
                },
                select: {
                    id: true,
                    status: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            price: true,
                            discount: true,
                            image: true,
                        }
                    }
                }
            });
            return res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error
            });
        }
    }

    @Post('/')
    async createFavorite(@CurrentUser() user: TUser,@Body() body: { productId: number } ,@Res() res: Response) {

        try {
            const { error } = createSchema.validate(body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { productId } = body;
            const existingFavorite = await prisma.favorite.findFirst({
                where: { 
                    userId: user.id,
                    productId,  
                },
                select: {
                    id: true
                }
            });

            if (existingFavorite) {

                await prisma.favorite.delete({
                    where: { id: existingFavorite.id }
                });

                return res.status(201).json({
                    success: true,
                    message: 'You have disliked the product.',
                    type: 'dislike',
                });

            } else {

                const result = await prisma.favorite.create({
                    data: {
                        userId: user.id,
                        productId: productId
                    }
                });

                return res.status(201).json({
                    success: true,
                    message: 'You have liked the product.',
                    type: 'like',
                    result,
                });
            }
            
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error
            });
        }
    }

}