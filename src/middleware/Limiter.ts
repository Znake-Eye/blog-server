import { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { Middleware, ExpressMiddlewareInterface } from "routing-controllers";

export const limitRequest = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: {
        success: false,
        message: 'Too many requests. please try again later!'
    },
    headers: true
});

export const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'You reached limit. please try again next 1 minute!'
    },
    headers: true
});

@Middleware({ type: 'before' })
export class LimitMiddleware implements ExpressMiddlewareInterface {
    use(request: Request, response: Response, next: (err?: any) => any) {
        limitRequest(request, response, next);
    }
}




