import { db } from "@/lib/db";
import { getSafeUser } from "@/lib/auth-wrapper";
import { redirect } from "next/navigation";

export default async function IndexPage() {
    const user = await getSafeUser();

    if (!user) {
        redirect("/sign-in");
    }

    // Check if user has a business
    const dbUser = await db.user.findUnique({
        where: { clerkId: user.id },
        include: { businessesOwned: true, staffAt: true },
    });

    if (dbUser && (dbUser.businessesOwned.length > 0 || dbUser.staffAt.length > 0)) {
        redirect("/dashboard");
    }

    redirect("/onboarding");
}
