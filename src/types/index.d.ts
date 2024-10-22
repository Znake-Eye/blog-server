import { UserStatus } from "@prisma/client";
export type TUser = {
    id?: number;
    username: string;
    password: string;
    identify?: string;
    email?: string;
    status?: UserStatus;
    currentToken?: string;
    createdAt?: string;
};

export type TPost = {
    id?: number;
    title: string;
    content: string;
    published: boolean;
    authorId: number;
};
