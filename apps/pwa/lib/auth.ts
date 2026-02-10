import { SignJWT } from "jose";

export async function signStampToken(payload: any) {
    const secret = new TextEncoder().encode(
        process.env.CLERK_SECRET_KEY || "default_secret_do_not_use_in_prod"
    );

    const alg = "HS256";

    return new SignJWT(payload)
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setExpirationTime("5m") // Token valid for 5 minutes
        .sign(secret);
}
