import * as jwt from "jsonwebtoken";

const secretKey = process.env.JWT_SECRET || '';

class Auth {
    public createAccessToken(id: number, username: string) {
        const payload = { id, username }
        const token = jwt.sign(payload, secretKey, {expiresIn: '1d', algorithm: 'HS512'});
        return token;
    }
}

const auth = new Auth();
export default auth;