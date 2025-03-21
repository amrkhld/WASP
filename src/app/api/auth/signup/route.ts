import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from 'dbConnect';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { message: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const users = db.collection('users');

        // Validate email format
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return NextResponse.json(
                { message: 'Invalid email format' },
                { status: 400 }
            );
        }

        const existingUser = await users.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'Email already registered' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        
        const result = await users.insertOne({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            createdAt: new Date()
        });

        if (!result.acknowledged) {
            throw new Error('Failed to create user');
        }

        return NextResponse.json(
            { message: 'User created successfully' },
            { status: 201 }
        );

    } catch (error) {
        console.error('Signup error:', error);
        
        // More specific error messages
        if (error instanceof Error) {
            return NextResponse.json(
                { message: `Error: ${error.message}` },
                { status: 500 }
            );
        }
        
        return NextResponse.json(
            { message: 'Internal server error during signup' },
            { status: 500 }
        );
    }
}
