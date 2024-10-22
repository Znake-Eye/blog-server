import { Action } from "routing-controllers";
import * as jwt from "jsonwebtoken";

const currentUser = async (action: Action) => {
    const secret = process.env.JWT_SECRET || '';
    const token = action.request.headers.authorization?.split(" ")[1];

    if(!token) {
        return null;
    }

    try {
        const decode = jwt.verify(token, secret);
        console.log('current user');
        console.log(decode);
        return decode;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export default currentUser;