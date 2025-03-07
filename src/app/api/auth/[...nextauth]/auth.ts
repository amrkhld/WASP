import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { connectToDatabase, clientPromise } from '../../../../../dbConnect';
import bcrypt from 'bcryptjs';
import { Db } from 'mongodb';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { 
                    label: 'Email', 
                    type: 'email', 
                    placeholder: 'Enter your email' 
                },
                password: { 
                    label: 'Password', 
                    type: 'password',
                    placeholder: 'Enter your password'
                }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Missing credentials');
                }

                try {
                    const { db } = await connectToDatabase();
                    const users = db.collection('users');

                    const user = await users.findOne({ 
                        email: credentials.email.toLowerCase() 
                    });

                    if (!user || !user.password) {
                        throw new Error('No user found');
                    }

                    const isValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isValid) {
                        throw new Error('Invalid password');
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    throw new Error('Authentication failed');
                }
            }
        })
    ],
    adapter: MongoDBAdapter(clientPromise()),
    session: {
        strategy: 'jwt'
    },
    pages: {
        signIn: '/auth/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string;
            }
            return session;
        }
    }
};
