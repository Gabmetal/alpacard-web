"use server";

import { db } from "@repo/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createCampaign(prevState: unknown, formData: FormData) {
    const user = await currentUser();
    if (!user) return { message: "Unauthorized" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const stampsRequired = parseInt(formData.get("stampsRequired") as string);

    if (!name || !description || isNaN(stampsRequired)) {
        return { message: "Invalid input" };
    }

    try {
        const dbUser = await db.user.findUnique({
            where: { clerkId: user.id },
            include: { businessesOwned: true },
        });

        if (!dbUser || dbUser.businessesOwned.length === 0) {
            return { message: "No business found" };
        }

        await db.campaign.create({
            data: {
                name,
                description,
                stampsRequired,
                businessId: dbUser.businessesOwned[0].id,
            },
        });

        revalidatePath("/dashboard/campaigns");
    } catch (error) {
        console.error("Failed to create campaign:", error);
        return { message: "Failed to create campaign" };
    }

    redirect("/dashboard/campaigns");
}
