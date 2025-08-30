import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET!;
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
        }

        const { rows } = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: MAX_AGE }
        );

        // Revert to using serialize for setting the cookie
        const cookie = serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            maxAge: MAX_AGE,
            path: '/',
            sameSite: 'lax',
        });

        const response = NextResponse.json({ message: 'Logged in successfully.' }, { status: 200 });
        response.headers.set('Set-Cookie', cookie);

        return response;

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'An error occurred during login.' }, { status: 500 });
    }
}
