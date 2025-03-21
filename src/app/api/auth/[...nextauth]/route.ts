// File: /pages/api/auth/[...nextauth].ts

import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { authOptions } from './auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
        } & DefaultSession['user']
    }
    
    interface User extends DefaultUser {
        id: string;
    }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

