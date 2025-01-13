import { 
    Body, 
    JsonController, 
    Post, 
    Req, 
    Res, 
    UseBefore, 
    CurrentUser, 
    Get, 
    Put,
    Param,
    UnauthorizedError,
    BadRequestError,
    Delete
} from "routing-controllers";
import { Response } from "express";
import { PrismaClient, User } from "@prisma/client";
import fs from "fs";
import path from "path";
import multer from "multer";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { removeFile } from "../utils";
import Joi from "joi";
import { TUser } from "../types";

const productSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
});

const prisma = new PrismaClient();

const rootDir = process.cwd();
const storeFolder = path.join(rootDir, 'uploads', 'products');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if(!fs.existsSync(storeFolder)) {
            fs.mkdirSync(storeFolder, { recursive: true});
        }
        cb(null, './uploads/products');
    },
    filename: (req, file, cb) => {
        const fileName = `${Date.now()}-${file.originalname}`
        cb(null, `${fileName}`);
    }
});

const fileFilter = (req, file, cb) => {
    cb(null, true);
    // const allowFileTypes= ['image/jpeg', 'image/png', 'image/jpg'];
    // if(allowFileTypes.includes(file.mimetype)) {
    //     cb(null, true);
    // } else {
    //     cb(new Error('Invalid file type'), false);
    // }
}

const upload = multer({ storage, fileFilter });

@JsonController('/product')
@UseBefore(AuthMiddleware)
export class UploadController {
    @Post('/')
    @UseBefore(upload.single('file'))
    async createProduct(@Body() body: any, @Req() req: any, @CurrentUser() user: User, @Res() res: Response) {

        const { error } = productSchema.validate(body);
        if (error) {
            throw new BadRequestError(error?.details[0]?.message);
        }

        const { name, description } = body;
        console.log('req file: ', req?.file);
        const fileName = req?.file?.filename || '';
        try {
            await prisma.product.create({
                data: {
                    name,
                    userId: user.id,
                    description,
                    image: fileName,
                }
            });

            return res.status(201).json({
                success: true,
                message: 'Product created successfully',
            })
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error?.message
            });
        }
    }
    @Get('/')
    async getProducts(@CurrentUser() user: TUser ,@Res() res: Response) {
        try {
            const response = await prisma.product.findMany({
                select: {
                    id: true,
                    name: true,
                    image: true,
                    price: true,
                    stock_status: true,
                    createdAt: true,
                    discount: true,
                    user: {
                        select: {
                            id: true,
                            image: true,
                            username: true
                        }
                    },
                    favorites: {
                        where: {
                            userId: user.id
                        },
                        select: {
                            status: true
                        }
                    },
                    // _count: {
                    //     select: {
                    //         favorites: true
                    //     }
                    // }
                }
            });
            return res.status(200).json({
                success: true,
                data: response,
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error?.message
            });
        }
    }
    @Put('/:id')
    @UseBefore(upload.single('file'))
    async updateProduct(
        @Param("id") id: number,
        @Body({ required: true}) body: any, 
        @Req() req: any, 
        @CurrentUser() user: User, 
        @Res() res: Response
    ) {
        try {

            const product = await prisma.product.findUnique({
                where: { id }
            });

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: 'Product not founded.'
                });
            }
    
            if (user.id !== product.userId) {
                throw new UnauthorizedError('Unauthorize to edit this product.');
            }

            const { error } = productSchema.validate(body);
            if (error) {
                throw new BadRequestError(error?.details[0]?.message);
            }

            const fileName = req?.file?.filename || '';
            const data: any = {
                name: body.name,
                description: body.description,
                ...(fileName && { image: fileName })
            };
            if (fileName && product.image) {
                const lastImageLocation = path.join(storeFolder, product.image);
                const isFileRemoved = removeFile(lastImageLocation);
                console.log(`file has been removed: ${isFileRemoved}`);
            }

            const editedProduct = await prisma.product.update({
                where: { id },
                data
            });
    
            return res.status(200).json({
                success: true,
                message: 'Edited product successfully',
                data: editedProduct
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error?.message
            });
        }
    }

    @Delete('/:id')
    async deleteProduct(@Param('id') id: number, @CurrentUser() user: User, @Res() res: Response) {
        try {
            const product = await prisma.product.findUnique({
                where: { id }
            });
            if (!product) {
                return res.status(400).json({ success: false, message: 'Product not founded.'});
            }
            if (product.userId !== user.id) {
                throw new UnauthorizedError('Unauthorize to delete this product.')
            }

            if (product.image) {
                const imageLocation = path.join(storeFolder, product.image);
                const isFileRemoved = removeFile(imageLocation);
                console.log(`file has been removed: ${isFileRemoved}`);
            }

            await prisma.product.delete({
                where: { id }
            });
            
            return res.status(200).json({
                success: true,
                message: 'Product has been deleted successfully.'
            })

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error?.message
            });
        }
    }
}