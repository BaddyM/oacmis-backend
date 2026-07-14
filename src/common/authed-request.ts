import { Request } from 'express';

// AuthGuard attaches { id, role } to request.user after verifying the bearer
// token. Controllers that need the caller's identity take this instead of the
// bare express Request.
export interface AuthUser {
    id: string;
    role: string;
}

export interface AuthedRequest extends Request {
    user: AuthUser;
}
