declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                rol_id: string;
            };
        }
    }
}

export {};
