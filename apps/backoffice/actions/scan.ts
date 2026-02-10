"use server";

import { db } from "@repo/db";
import { currentUser } from "@clerk/nextjs/server";
import { jwtVerify } from "jose";


export async function verifyAndAddStamp(token: string) {
    const user = await currentUser();
    if (!user) return { success: false, message: "Unauthorized" };

    // 1. Verify Staff/Owner
    const dbUser = await db.user.findUnique({
        where: { clerkId: user.id },
        include: { staffAt: true, businessesOwned: true },
    });

    if (!dbUser) return { success: false, message: "User not found" };

    // Check if user is owner or staff
    const isOwner = dbUser.businessesOwned.length > 0;
    const isStaff = dbUser.staffAt.length > 0;

    if (!isOwner && !isStaff) {
        return { success: false, message: "Not authorized to scan" };
    }

    // 2. Verify Token
    const secret = new TextEncoder().encode(
        process.env.CLERK_SECRET_KEY || "default_secret_do_not_use_in_prod"
    );

    try {
        const { payload } = await jwtVerify(token, secret);

        if (payload.type !== "stamp") {
            return { success: false, message: "Invalid QR code" };
        }

        const cardId = payload.cardId as string;

        // 3. Get Card
        const card = await db.card.findUnique({
            where: { id: cardId },
            include: { campaign: true },
        });

        if (!card) return { success: false, message: "Card not found" };

        // 4. Verify Business Ownership/Staff logic
        // The scanner must belong to the business of the campaign
        // Logic: 
        // - If Owner, must own card.campaign.businessId
        // - If Staff, must be staff at card.campaign.businessId

        const campaignBusinessId = card.campaign.businessId;

        const ownsBusiness = dbUser.businessesOwned.some(b => b.id === campaignBusinessId);
        const worksAtBusiness = dbUser.staffAt.some(b => b.id === campaignBusinessId);

        if (!ownsBusiness && !worksAtBusiness) {
            return { success: false, message: "This card does not belong to your business" };
        }

        // 5. Add Stamp
        // Check limit? prompt says "Cantidad de sellos requeridos". 
        // If stamps >= required, maybe we are REDEEMING?
        // For now, let's assume we just add stamps up to the limit?
        // Or we handle redemption separately?
        // Prompt says "Agregar sellos / Validar canjes".
        // MVP: If card.stamps < required, add stamp. If equal, redeem?

        let action = "EARN";

        if (card.stamps >= card.campaign.stampsRequired) {
            // Validation/Redemption logic
            // Reset stamps? Or just mark transaction as REDEEM?
            // Let's reset stamps to 0 and log REDEEM.
            action = "REDEEM";
        }

        if (action === "EARN") {
            await db.card.update({
                where: { id: card.id },
                data: { stamps: { increment: 1 } },
            });

            await db.transaction.create({
                data: {
                    type: "EARN",
                    amount: 1,
                    cardId: card.id,
                    staffId: dbUser.id,
                }
            });

            return { success: true, message: "Stamp added!", newCount: card.stamps + 1 };
        } else {
            // Redeem
            await db.card.update({
                where: { id: card.id },
                data: { stamps: 0 }, // Reset
            });

            await db.transaction.create({
                data: {
                    type: "REDEEM",
                    amount: card.campaign.stampsRequired,
                    cardId: card.id,
                    staffId: dbUser.id,
                }
            });

            return { success: true, message: "Reward redeemed!", newCount: 0 };
        }

    } catch (error) {
        console.error(error);
        return { success: false, message: "Invalid or expired token" };
    }
}
