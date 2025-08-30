import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

interface UserPayload {
  userId: string;
  email: string;
}

export async function getToken(req?: NextRequest): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  console.log(
    "Auth (getToken): Token from cookie",
    token ? "exists" : "does not exist",
    "(value:",
    token ? token.substring(0, 10) + "..." : "null",
    ")"
  );

  if (!token) {
    console.log("Auth (getToken): No token found, returning null.");
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
    console.log("Auth (getToken): Decoded user", decoded);
    return decoded;
  } catch (error) {
    console.error(
      "Auth (getToken): Invalid token or JWT_SECRET missing/invalid",
      error
    );
    return null;
  }
}
