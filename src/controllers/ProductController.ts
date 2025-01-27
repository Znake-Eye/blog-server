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
    Delete,
    QueryParam
} from "routing-controllers";
import { Response } from "express";
import { PrismaClient, User, StockSTatus } from "@prisma/client";
import fs from "fs";
import path from "path";
import multer from "multer";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { removeFile } from "../utils";
import Joi from "joi";
import { TUser } from "../types";

const productSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    categoryId: Joi.string().allow('').optional(),
    brandId: Joi.string().allow('').optional(),
    file: Joi.any().optional(),
    price: Joi.string().required(),
    discount: Joi.string().allow('').optional(),
    stock_status: Joi.string().valid(StockSTatus.INSTOCK, StockSTatus.OUTSTOCK).required()
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
    // cb(null, true);
    const allowFileTypes= ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if(allowFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not allow. Please change the image.'), false);
    }
}

const upload = multer({ storage, fileFilter });

@JsonController('/product')
@UseBefore(AuthMiddleware)
export class UploadController {
    @Post('/')
    // @UseBefore(upload.single('file'))
    @UseBefore((req, res, next) => upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError || err instanceof Error) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    }))
    async createProduct(@Body() body: any, @Req() req: any, @CurrentUser() user: User, @Res() res: Response) {

        const { error } = productSchema.validate(body);
        if (error) {
            throw new BadRequestError(error?.details[0]?.message);
        }

        const { name, description, categoryId, brandId, price, discount, stock_status } = body;
        const fileName = req?.file?.filename || '';
        try {
            const product = await prisma.product.create({
                data: {
                    name,
                    userId: user.id,
                    description,
                    categoryId: Number(categoryId) || null,
                    brandId: Number(brandId) || null,
                    price: Number(price) || 0,
                    discount: Number(discount) || 0,
                    stock_status,
                    image: fileName,
                }
            });

            return res.status(201).json({
                success: true,
                data: product,
                message: 'Product created successfully',
            })
        } catch (error) {
            console.log('error: ', error);
            return res.status(400).json({
                success: false,
                message: error
            });
        }
    }
    @Get('/all')
    async getAllProduct(
        @QueryParam("search") search: string = "",
        @QueryParam("pageSize") pageSize: number = 15,
        @QueryParam('page') page: number = 1,
        @QueryParam('stock_status') stock_status: string = "",
        @QueryParam('brandId') brandId: string = '',
        @QueryParam('categoryId') categoryId: string = '',
        @CurrentUser() user: TUser,
        @Res() res: Response
    ) {
        try {
            const skipAmount = (page - 1) * pageSize;

            const AndFilter: any[] = [{
                OR: [
                    { name: { contains: search, mode: 'insensitive' }},
                    { description: { contains: search, mode: 'insensitive' }},
                ]
            }];

            if (stock_status) {
                AndFilter.push({ stock_status });
            }

            if (brandId) {
                AndFilter.push({ brandId: Number(brandId) });
            }

            if (categoryId) {
                AndFilter.push({ categoryId: Number(categoryId) });
            }

            const [products, totalProducts] = await Promise.all([
                prisma.product.findMany({
                    where: {
                        AND: AndFilter
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                        price: true,
                        stock_status: true,
                        createdAt: true,
                        discount: true,
                        brand: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                        category: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
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
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: skipAmount,
                    take: pageSize
                }),

                prisma.product.count({
                    where: {
                        AND: AndFilter
                    }
                }),

            ]);

            const pagination = {
                totalPages: Math.ceil(totalProducts / pageSize),
                currentPage: page,
                item: totalProducts,
                pageSize,
            }

            return res.status(200).json({
                success: true,
                data: products,
                pagination,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error?.message
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
                    description: true,
                    image: true,
                    price: true,
                    stock_status: true,
                    createdAt: true,
                    discount: true,
                    brand: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    category: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
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
    
            if (user.id !== product.userId && user?.roleType !== 'ADMIN') {
                throw new UnauthorizedError('Unauthorize to edit this product.');
            }

            const { error } = productSchema.validate(body);
            if (error) {
                throw new BadRequestError(error?.details[0]?.message);
            }

            const fileName = req?.file?.filename || '';

            const { name, description, categoryId, brandId, price, discount, stock_status } = body;
            
            const editedProduct = await prisma.product.update({
                where: { id },
                data: {
                    name,
                    description,
                    categoryId: Number(categoryId) || null,
                    brandId: Number(brandId) || null,
                    price: Number(price) || 0,
                    discount: Number(discount) || 0,
                    stock_status,
                    ...(fileName && { image: fileName })
                }
            });

            if (fileName && product.image) {
                const lastImageLocation = path.join(storeFolder, product.image);
                const isFileRemoved = removeFile(lastImageLocation);
                console.log(`file has been removed: ${isFileRemoved}`);
            }
    
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

            if (product.userId !== user.id && user?.roleType !== 'ADMIN') {
                throw new UnauthorizedError('Unauthorize to delete this product.')
            }

            await prisma.product.delete({
                where: { id }
            });

            if (product.image) {
                const imageLocation = path.join(storeFolder, product.image);
                const isFileRemoved = removeFile(imageLocation);
                console.log(`file has been removed: ${isFileRemoved}`);
            }
            
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