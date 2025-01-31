import { Response } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { JsonController, Post, UseBefore, Get, Res, Body, Put, Param, Delete, QueryParam, Req } from "routing-controllers";
import prisma from "../../prisma";
import Joi from "joi";
import path from "path";
import { removeFile } from "../utils";
import { MulterImageUploader } from "../lib/Multer";


const createSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    file: Joi.any().optional()
});

const rootDir = process.cwd();
const storeFolder = path.join(rootDir, 'uploads', 'brands');
const multerService = new MulterImageUploader(storeFolder);

@JsonController('/brand')
@UseBefore(AuthMiddleware)
export class BrandController {

    @Get('/')
    async getBrand(@QueryParam('search') search: string, @Res() res: Response) {
        try {
            const data = await prisma.brand.findMany({
                where: {
                    name: { contains: search, mode: 'insensitive' }
                },
                orderBy: { id: "desc" }
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
    @UseBefore(multerService.upload.single('file'))
    async createBrand(@Req() req: any, @Body() body: { name: string, description: string, file: any } ,@Res() res: Response) {

        try {
            const { error } = createSchema.validate(body);
            const fileName = req?.file?.filename || null;
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { name, description } = body;

            await prisma.brand.create({
                data: {  
                    name,
                    description,
                    ...(fileName && { image: fileName })
                 }
            });

            return res.status(201).json({
                success: true,
                message: 'Brand created successfully.'
            });

        } catch (error) {

            if (error?.code == 'P2002') {
                return res.status(400).json({
                    success: false,
                    message: `${body?.name} brand already exist`
                });
            }

            return res.status(500).json({
                success: false,
                message: error
            });
        }
    }

    @Put('/:id')
    @UseBefore(multerService.upload.single('file'))
    async updateBrand(@Param("id") id: number, @Req() req: any, @Body() body: { name: string, description: string, file: any }, @Res() res: Response) {
        try {
            const { error } = createSchema.validate(body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { name, description } = body;
            const fileName = req?.file?.filename || null

            const data = {
                name,
                description,
                ...(fileName && { image: fileName })
            };

            const brand = await prisma.brand.findFirst({ 
                where: { id }
            });

            if (fileName && brand?.image) {
                const imageLocation = path.join(storeFolder, brand.image);
                const isFileRemoved = removeFile(imageLocation);
                console.log('is file remove: ', isFileRemoved);
            }

            await prisma.brand.update({
                where: { id },
                data
            });

            return res.status(201).json({
                success: true,
                message: 'Category updated successfully.'
            });

        } catch (error) {

            if (error?.code == 'P2002') {
                return res.status(400).json({
                    success: false,
                    message: `${body?.name} brand already exist`
                });
            }

            return res.status(400).json({
                success: false,
                message: error
            });
        }
    }

    @Delete('/:id')
    async deleteBrand(@Param('id') id: number, @Res() res: Response) {
        try {

            const brand = await prisma.brand.findFirst({
                where: { id }
            });

            if (brand?.image) {
                const imageLocation = path.join(storeFolder, brand.image);
                const isFileRemoved = removeFile(imageLocation);
                console.log(`file has been removed: ${isFileRemoved}`);
            }

            await prisma.brand.delete({
                where: { id }
            });

            return res.status(200).json({
                success: true,
                message: 'Brand deleted successfully.'
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }
    }
    
}