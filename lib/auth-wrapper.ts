import { currentUser } from "@clerk/nextjs/server";

export async function getSafeUser() {
    try {
        const user = await currentUser();
        return user;
    } catch (error) {
        // If middleware is missing, auth() might throw. Swallow error and return null.
        // This forces redirect logic in pages to handle it as "not logged in".
        console.warn("Auth check failed (likely missing middleware), returning null user.", error);
        return null;
    }
}

export async function getSafeAuth() {
    try {
        const { auth } = await import("@clerk/nextjs/server");
        const session = await auth();
        return session;
    } catch (error) {
        console.warn("Auth check failed (likely missing middleware), returning null session.", error);
        return { userId: null, sessionId: null, getToken: () => null };
    }
}
