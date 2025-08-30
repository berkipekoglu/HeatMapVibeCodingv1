import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        console.log('Signup API: Request received.');
        const { email, password } = await request.json();
        console.log('Signup API: Parsed email and password.');

        if (!email || !password) {
            console.log('Signup API: Missing email or password.');
            return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
        }

        // Check if user already exists
        console.log('Signup API: Checking if user exists...');
        const { rows } = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (rows.length > 0) {
            console.log('Signup API: User already exists.');
            return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
        }
        console.log('Signup API: User does not exist, proceeding with signup.');

        console.log('Signup API: Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Signup API: Password hashed.');

        console.log('Signup API: Inserting new user into database...');
        await sql`
            INSERT INTO users (email, password_hash)
            VALUES (${email}, ${hashedPassword})
        `;
        console.log('Signup API: User inserted successfully.');

        return NextResponse.json({ message: 'User created successfully.' }, { status: 201 });

    } catch (error) {
        console.error('Signup API Error:', error);
        return NextResponse.json({ message: 'An error occurred during signup.' }, { status: 500 });
    }
}
