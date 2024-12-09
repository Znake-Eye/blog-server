import { 
    Body, 
    JsonController, 
    Post, 
    Req, 
    Res, 
    UseBefore, 
    CurrentUser, 
    Get 
} from "routing-controllers";
import { Response } from "express";
import { PrismaClient, User } from "@prisma/client";
import fs from "fs";
import path from "path";
import multer from "multer";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import Joi from "joi";

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
            return res.status(400).json({
                success: false,
                message: error?.details[0]?.message
            });
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
    async getProducts(@Res() res: Response) {
        try {
            const response = await prisma.product.findMany({});
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
}