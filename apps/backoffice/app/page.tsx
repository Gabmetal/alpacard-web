import { db } from "@repo/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function IndexPage() {
    const user = await currentUser();

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
