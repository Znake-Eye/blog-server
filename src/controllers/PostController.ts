import { 
    JsonController,
    UseBefore,
    Res,
    Body,
    Get,
    Post,
    QueryParam, 
    CurrentUser,
    Param,
    Delete,
    Put
} 
from "routing-controllers";
import { Response } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { TUser, TPost } from "../types";
import { resultStatus } from "../enums";
import prisma from "../../prisma";
import Joi from "joi";

const postSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    published: Joi.boolean().required(),
    content: Joi.string().min(10).required()
});
  
@JsonController("/posts")
@UseBefore(AuthMiddleware)
export class PostController {

    @Get("/")
    async getPostsDashboard(
        @QueryParam("search") search: string = "",
        @QueryParam("pageSize") pageSize: number = 10,
        @QueryParam("page") page: number = 1, 
        @Res() res: Response,
    ) {
        try {
            const skipAmount = (page - 1) * pageSize;
            const [result, totalPosts] = await Promise.all([
                prisma.post.findMany({
                    where: {
                            OR: [
                                { title: { contains: search, mode: 'insensitive' }},
                                { content: { contains: search, mode: 'insensitive' }}
                            ]
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                            }
                        }
                    },
                    orderBy: [{ createdAt: 'desc' }],
                    skip: skipAmount,
                    take: pageSize
                }),

                prisma.post.count({
                    where: {
                        OR: [
                            { title: { contains: search, mode: 'insensitive' }},
                            { content: { contains: search, mode: 'insensitive' }}
                        ]
                    },
                })
            ]);

            const pagination = {
                totalPages : Math.ceil(totalPosts / pageSize),
                currentPage: page,
                item: totalPosts,
                pageSize,
            }
            return res.status(200).json({
                data: result,
                pagination: pagination
            });

        } catch (error) {
            return res.status(400).json({
                status: resultStatus.FAILED,
                message: error,
            });
        }
    }

    @Get("/public")
    async getPostspublic(
        @QueryParam("search") search: string = "",
        @QueryParam("pageSize") pageSize: number = 10,
        @QueryParam("page") page: number = 1, 
        @Res() res: Response,
    ) {
        try {
            const skipAmount = (page - 1) * pageSize;
            const [result, totalPosts] = await Promise.all([
                prisma.post.findMany({
                    where: {
                        AND: [
                            {
                                OR: [
                                    { title: { contains: search, mode: 'insensitive' }},
                                    { content: { contains: search, mode: 'insensitive' }}
                                ]
                            },
                            { published: true }
                        ]
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                            }
                        }
                    },
                    orderBy: [{ createdAt: 'desc' }],
                    skip: skipAmount,
                    take: pageSize
                }),

                prisma.post.count({
                    where: {
                        AND: [
                            {
                                OR: [
                                    { title: { contains: search, mode: 'insensitive' }},
                                    { content: { contains: search, mode: 'insensitive' }}
                                ]
                            },
                            { published: true }
                        ]
                    },
                })
            ]);

            const pagination = {
                totalPages : Math.ceil(totalPosts / pageSize),
                currentPage: page,
                item: totalPosts,
                pageSize,
            }
            return res.status(200).json({
                data: result,
                pagination: pagination
            });

        } catch (error) {
            return res.status(400).json({
                status: resultStatus.FAILED,
                message: error,
            });
        }
    }

    @Post("/")
    async create(
        @Body({ required: true }) req: TPost,
        @CurrentUser() currentUser: TUser,
        @Res() res: Response,
    ) {

        const { error } = postSchema.validate(req);
        if(error) {
            return res.status(400).send({
                message:  error.details[0].message
            });
        }

        try {
            const createPost = await prisma.post.create({
                data: {
                    title: req.title,
                    content: req.content,
                    published: req.published,
                    authorId: currentUser.id || 0
                }
            })
            return res.status(201).json({
                status: resultStatus.SUCCESS,
                message: 'Post has created.',
                data: createPost
            });

        } catch (error: any) {
            return res.status(400).json({
                message: error,
            });
        }
    }

    @Get('/user/:id')
    async getPostByUser(@Param("id") id: number, @Res() res: Response) {
        try {
            const filterCondition = { authorId: id };
            const data = await prisma.post.findMany({
                where: filterCondition
            });
            return res.status(200).json({
                userId: id,
                data
            });

        } catch (error) {
            return res.status(400).json({
                message: error
            });
        }
    }

    @Put('/:id')
    async updatePost(@Param("id") id: number, @Body({ required: true }) req: TPost, @Res() res: Response) {
        try {
            const {error} = postSchema.validate(req);
            if(error) {
                return res.status(400).send({
                    message:  error.details[0].message
                });
            }

            const updatePost = await prisma.post.update({
                where: { id: id},
                data: {
                    title: req.title,
                    content: req.content,
                    published: req.published
                }
            });
            return res.status(200).json({
                status: resultStatus.SUCCESS,
                data: updatePost,
                message: 'Update successfully',
            });

        } catch (error) {
            return res.status(400).json({
                status: resultStatus.FAILED,
                message: error
            });
        }
    }

    @Delete('/:id')
    async deletePost(@Param("id") id: number, @Res() res: Response) {
        try {
            const deletePost = await prisma.post.delete({
                where: { id: id }
            });
            return res.status(200).json({
                status: resultStatus.SUCCESS,
                data: deletePost,
                message: 'delete successfully',
            })
        } catch (error) {
            return res.status(400).json({
                message: error
            })
        }
    }


};

