import { db } from "@repo/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface PageProps {
    params: { id: string };
}

export default async function ClaimPage({ params }: PageProps) {
    const { id } = await params;
    const user = await currentUser();

    // If not logged in, Clerk middleware might have intercepted, 
    // but if this route is public (as defined in middleware), we handle it here.
    if (!user) {
        return redirect(`/sign-in?redirect_url=/customer/claim/${id}`);
    }

    const campaign = await db.campaign.findUnique({
        where: { id },
    });

    if (!campaign || !campaign.isActive) {
        return <div>Campaign not found or inactive.</div>;
    }

    // Logic fix: Schema Card links to User (ObjectId), not Clerk ID directly (though we store ClerkId in User).
    // We need to get DB User first.
    let dbUser = await db.user.findUnique({
        where: { clerkId: user.id },
    });

    if (!dbUser) {
        // Just in case (should handle via webhook or lazy create)
        dbUser = await db.user.create({
            data: {
                clerkId: user.id,
                email: user.emailAddresses[0].emailAddress,
                role: "CONSUMER",
            },
        });
    }

    const existingCard = await db.card.findUnique({
        where: {
            userId_campaignId: {
                userId: dbUser.id,
                campaignId: id,
            },
        },
    });

    if (existingCard) {
        redirect(`/customer/wallet/${existingCard.id}`);
    }

    // Create Card
    const newCard = await db.card.create({
        data: {
            userId: dbUser.id,
            campaignId: id,
            stamps: 0,
        },
    });

    redirect(`/customer/wallet/${newCard.id}`);
}
