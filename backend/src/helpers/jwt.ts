import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecret123';

export const generateToken = (payload: object): string => {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '1d' });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
};
