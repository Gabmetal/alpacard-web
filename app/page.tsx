import { db } from "@/lib/db";
import { getSafeUser } from "@/lib/auth-wrapper";
import { redirect } from "next/navigation";

export default async function IndexPage() {
    const user = await getSafeUser();

    if (!user) {
        redirect("/sign-in");
    }

    // Check if user exists in DB and what they have
    const dbUser = await db.user.findUnique({
        where: { clerkId: user.id },
        include: {
            businessesOwned: true,
            staffAt: true,
            cards: { take: 1 }
        },
    });

    // 1. If they have business associations, go to Dashboard
    if (dbUser && (dbUser.businessesOwned.length > 0 || dbUser.staffAt.length > 0)) {
        return redirect("/dashboard");
    }

    // 2. If they are a consumer (have cards or explicitly role CONSUMER), go to Wallet
    if (dbUser && (dbUser.cards.length > 0 || dbUser.role === "CONSUMER")) {
        return redirect("/customer/wallet");
    }

    // 3. User is logged into Clerk but not in our DB yet, or has no role-specific data.
    // If they hit the root /, we'll default to wallet (the consumer view) 
    // to avoid confusing consumers with business onboarding.
    // They can still find onboarding if they look for it, or we can add a choice here.
    return redirect("/customer/wallet");
}
