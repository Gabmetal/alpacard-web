import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
    '/((?!sign-in|sign-up|customer/claim).*)',
]);

const isCustomerRoute = createRouteMatcher(['/customer(.*)']);

export default clerkMiddleware(async (auth, req) => {
    // If it's a customer route (except claim), it needs auth. 
    // If it's a dashboard route, it needs auth.
    // Actually, simply protecting everything except public routes is easier.

    // Allow public access to /customer/claim/... 
    // (The page itself handles auth check if strictly needed, but usually claim is entry point)
    // Wait, the claim page checks currentUser() and redirects if missing. 
    // So allowing it in middleware is correct.

    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
