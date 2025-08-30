import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // Create a response object
        const response = NextResponse.json({ message: 'Logged out successfully.' }, { status: 200 });

        // Use the modern Next.js way to delete the cookie
        response.cookies.delete('token');

        return response;

    } catch (error) {
        console.error('Logout Error:', error);
        return NextResponse.json({ message: 'An error occurred during logout.' }, { status: 500 });
    }
}
