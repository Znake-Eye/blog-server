import * as jwt from "jsonwebtoken";

const secretKey = process.env.JWT_SECRET || '';

class Auth {
    public createAccessToken(id: number, username: string, roleType: string) {
        const payload = { id, username, roleType }
        const token = jwt.sign(payload, secretKey, {expiresIn: '7d', algorithm: 'HS512'});
        return token;
    }
}

const auth = new Auth();
export default auth;