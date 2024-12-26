import { Response } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { JsonController, Post, UseBefore, Get, Res, Body, Put, Param, Delete } from "routing-controllers";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import Joi from "joi";

const createSchema = Joi.object({
    name: Joi.string().required()
});

@JsonController('/category')
@UseBefore(AuthMiddleware)
export class CategoryController {

    @Get('/')
    async getCategory(@Res() res: Response) {
        try {
            const data = await prisma.category.findMany({});
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
    async createCategory(@Body() body: { name: string } ,@Res() res: Response) {

        try {
            const { error } = createSchema.validate(body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { name } = body;

            await prisma.category.create({
                data: {  name }
            });

            return res.status(201).json({
                success: true,
                message: 'Category created successfully.'
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error
            });
        }
    }

    @Put('/:id')
    async updateCategory(@Param("id") id: number, @Body() body: { name: string}, @Res() res: Response) {
        try {
            const { error } = createSchema.validate(body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { name } = body;
            await prisma.category.update({
                where: { id },
                data: { name }
            });

            return res.status(201).json({
                success: true,
                message: 'Category updated successfully.'
            });

        } catch (error) {
            return res.status(500).json({
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
            return res.status(500).json({
                success: false,
                message: error
            });
        }
    }
    
}