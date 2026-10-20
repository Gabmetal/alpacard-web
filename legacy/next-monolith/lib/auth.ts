import { SignJWT } from "jose";

export async function signStampToken(payload: Record<string, unknown>) {
    const secret = new TextEncoder().encode(
        process.env.CLERK_SECRET_KEY || "default_secret_do_not_use_in_prod"
    );

    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(secret);
}
