import { Response } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { JsonController, Post, UseBefore, Get, Res, Body, Put, Param, Delete, QueryParam, Req } from "routing-controllers";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
const prisma = new PrismaClient();
import Joi from "joi";
import path from "path";
import multer from "multer";
import { removeFile } from "../utils";

const createSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    file: Joi.any().optional()
});

const rootDir = process.cwd();
const storeFolder = path.join(rootDir, 'uploads', 'brands');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if(!fs.existsSync(storeFolder)) {
            fs.mkdirSync(storeFolder, { recursive: true});
        }
        cb(null, './uploads/brands');
    },
    filename: (req, file, cb) => {
        const fileName = `${Date.now()}-${file.originalname}`
        cb(null, `${fileName}`);
    }
});

const fileFilter = (req, file, cb) => {
    cb(null, true);
}
const upload = multer({ storage, fileFilter });


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
    @UseBefore(upload.single('file'))
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
    @UseBefore(upload.single('file'))
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