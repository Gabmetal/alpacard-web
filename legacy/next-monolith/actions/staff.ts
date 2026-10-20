"use server";

import { db } from "@/lib/db";
import { getSafeUser } from "@/lib/auth-wrapper";
import { revalidatePath } from "next/cache";

export async function addStaff(prevState: unknown, formData: FormData) {
    const user = await getSafeUser();
    if (!user) return { message: "Unauthorized" };

    const email = formData.get("email") as string;
    if (!email) return { message: "Email is required" };

    try {
        const ownerUser = await db.user.findUnique({
            where: { clerkId: user.id },
            include: { businessesOwned: true },
        });

        if (!ownerUser || ownerUser.businessesOwned.length === 0) {
            return { message: "No business found" };
        }
        const businessId = ownerUser.businessesOwned[0].id;

        // Find target user by email
        const targetUser = await db.user.findUnique({
            where: { email },
        });

        if (!targetUser) {
            return { message: "User not found. Please ask them to sign up as a consumer first." };
        }

        if (targetUser.id === ownerUser.id) {
            return { message: "You are already the owner." };
        }

        // Connect user to business as staff
        await db.business.update({
            where: { id: businessId },
            data: {
                staff: {
                    connect: { id: targetUser.id },
                },
            },
        });

        // Update target user role if they are just a consumer
        if (targetUser.role === "CONSUMER") {
            await db.user.update({
                where: { id: targetUser.id },
                data: { role: "STAFF" },
            });
        }

        revalidatePath("/dashboard/staff");
        return { message: "Staff added successfully", success: true };
    } catch (error) {
        console.error("Failed to add staff:", error);
        return { message: "Failed to add staff" };
    }
}

export async function removeStaff(formData: FormData) {
    const user = await getSafeUser();
    if (!user) return;

    const staffId = formData.get("staffId") as string;
    if (!staffId) return;

    try {
        const ownerUser = await db.user.findUnique({
            where: { clerkId: user.id },
            include: { businessesOwned: true },
        });

        if (!ownerUser || ownerUser.businessesOwned.length === 0) return;

        await db.business.update({
            where: { id: ownerUser.businessesOwned[0].id },
            data: {
                staff: {
                    disconnect: { id: staffId }
                }
            }
        });

        // Optional: Downgrade role back to CONSUMER if no other staff positions?
        // For MVP, we leave them as STAFF or manual update.

        revalidatePath("/dashboard/staff");
    } catch (e) {
        console.error(e);
    }
}
