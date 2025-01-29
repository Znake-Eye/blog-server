import { Response } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { JsonController, Post, UseBefore, Get, Res, Body, CurrentUser, Put, Param, Delete, QueryParam } from "routing-controllers";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import Joi from "joi";
import { TUser } from "../types";

const createSchema = Joi.object({
    productId: Joi.number().required(),
    item_price: Joi.number().optional(),
    qty: Joi.number().optional()
});

@JsonController('/cart')
@UseBefore(AuthMiddleware)
export class CategoryController {

    @Get('/')
    async getCart(
        @CurrentUser() user: TUser, 
        @QueryParam('page') page: number = 1,
        @QueryParam('pageSize') pageSize: number = 15,
        @QueryParam('search') search: string = '',
        @Res() res: Response
    ) {
        try {

            const skipAmount = (page - 1) * pageSize;

            const [total, data] = await Promise.all([
                prisma.cart.count({
                    where: {
                        userId: user?.id
                    }
                }),
                prisma.cart.findMany({
                    where: {
                        userId: user?.id
                    },
                    select: {
                        id: true,
                        item_price: true,
                        qty: true,
                        product: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        image: true,
                                    }
                                },
                                brand: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        },
                    },
                    take: pageSize,
                    skip: skipAmount,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
            ]);

            const totalPage = Math.ceil(total / pageSize);

            return res.status(200).json({
                success: true,
                data,
                pagination: {
                    totalPages: totalPage,
                    currentPage: page,
                    item: total,
                    pageSize
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error
            });
        }
    }

    @Post('/')
    async createCart(
        @CurrentUser() user: TUser,
        @Body() body: { 
            productId: number,
            qty: number,
            item_price: number, 
        },
        @Res() res: Response
    ) {
        try {
            const { error } = createSchema.validate(body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { productId, qty, item_price } = body;
            const result = await prisma.cart.upsert({
                where: {
                    userId_productId: {
                        userId: user.id,
                        productId
                    }
                },
                update: {
                    qty: { increment: qty || 1 },
                    ...(item_price && { item_price })
                },
                create: {
                    productId,
                    userId: user.id,
                    qty: qty || 1,
                    item_price: item_price || 0
                },
            });

            return res.status(200).json({
                success: true,
                message: 'Add to cart successfully.',
                result
            });
            
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error
            });
        }
    }

    @Put('/:id')
    async updateCart(@Param('id') id: number, @Body() body: { qty: number }, @Res() res: Response) {
        if (!body?.qty) {
            return res.status(400).json({
                success: false,
                message: 'Qty is required.'
            });
        }

        try {
            if (body?.qty > 0) {
                await prisma.cart.update({
                    where: { id },
                    data: {
                        qty: { increment: body.qty }
                    }
                });
            } else if (body?.qty < 0) {
                await prisma.cart.update({
                    where: { id },
                    data: {
                        qty: { decrement: body.qty }
                    }
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Save successfully.'
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error
            });
        }
    }

    @Delete('/:id')
    async deleteCart(@Param('id') id: number, @Res() res: Response) {
        try {
            await prisma.cart.delete({
                where: { id }
            });
            return res.status(200).json({
                success: true,
                message: 'cart deleted successfully.'
            });
            
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error
            });
        }
    }

}