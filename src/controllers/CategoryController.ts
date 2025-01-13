import { Response } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { JsonController, Post, UseBefore, Get, Res, Body, Put, Param, Delete, QueryParam } from "routing-controllers";
import { CategoryType, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import Joi from "joi";

const createSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    type: Joi.string().valid(CategoryType.BLOG, CategoryType.PRODUCT).required(),
});


@JsonController('/category')
@UseBefore(AuthMiddleware)
export class CategoryController {

    @Get('/')
    async getCategory(@QueryParam('type') type: CategoryType, @QueryParam('search') search: string, @Res() res: Response) {
        try {
            const filter: any[] = [
                { name: { contains: search, mode: 'insensitive'} },
            ];

            if (type) {
                filter.push({ type: type });
            }

            const data = await prisma.category.findMany({
                where: {
                    AND: filter
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
    async createCategory(@Body() body: { name: string, description: string, type: CategoryType } ,@Res() res: Response) {

        try {
            const { error } = createSchema.validate(body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { name, description, type } = body;

            await prisma.category.create({
                data: {  
                    name,
                    description,
                    ...(type === 'PRODUCT' && { type: CategoryType.PRODUCT })
                 }
            });

            return res.status(201).json({
                success: true,
                message: 'Category created successfully.'
            });

        } catch (error) {

            if (error?.code == 'P2002') {
                return res.status(400).json({
                    success: false,
                    message: `${body?.name} category already exist`
                });
            }

            return res.status(500).json({
                success: false,
                message: error
            });
        }
    }

    @Put('/:id')
    async updateCategory(@Param("id") id: number, @Body() body: { name: string, description: string }, @Res() res: Response) {
        try {
            const { error } = createSchema.validate(body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { name, description } = body;
            await prisma.category.update({
                where: { id },
                data: { name, description }
            });

            return res.status(201).json({
                success: true,
                message: 'Category updated successfully.'
            });

        } catch (error) {

            if (error?.code == 'P2002') {
                return res.status(400).json({
                    success: false,
                    message: `${body?.name} category already exist`
                });
            }

            return res.status(400).json({
                success: false,
                message: error
            });
        }
    }

    @Delete('/:id')
    async deleteCategory(@Param('id') id: number, @Res() res: Response) {
        try {
            await prisma.category.delete({
                where: {
                    id
                }
            });
            return res.status(200).json({
                success: true,
                message: 'Product deleted successfully.'
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }
    }
    
}