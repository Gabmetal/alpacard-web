"use server";

import { db } from "@/lib/db";
import { getSafeUser } from "@/lib/auth-wrapper";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createBusiness(prevState: unknown, formData: FormData) {
    const user = await getSafeUser();
    if (!user) return { message: "Unauthorized" };

    const name = formData.get("name") as string;
    if (!name) return { message: "Name is required" };

    try {
        // 1. Ensure User exists
        const dbUser = await db.user.upsert({
            where: { clerkId: user.id },
            update: { role: "OWNER" }, // Upgrade to OWNER if they create a business
            create: {
                clerkId: user.id,
                email: user.emailAddresses[0].emailAddress,
                role: "OWNER", // Default to OWNER if creating a business
            },
        });

        // 2. Create Business
        await db.business.create({
            data: {
                name,
                ownerId: dbUser.id,
                // Add owner as staff too? Maybe not needed strictly due to 'owner' relation
            },
        });

        // 3. Revalidate and Redirect
        revalidatePath("/");
    } catch (error) {
        console.error("Failed to create business:", error);
        return { message: "Failed to create business" };
    }

    redirect("/dashboard");
}
