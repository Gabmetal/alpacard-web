import { db } from "@/lib/db";
import { getSafeUser } from "@/lib/auth-wrapper";
import { redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import { signStampToken } from "../../../../lib/auth";

interface PageProps {
    params: { cardId: string };
}

export default async function CardPage({ params }: PageProps) {
    const { cardId } = await params;
    const user = await getSafeUser();
    if (!user) return redirect("/sign-in");

    const card = await db.card.findUnique({
        where: { id: cardId },
        include: { campaign: true },
    });

    if (!card) return <div>Card not found</div>;

    // Generate signed token
    // Payload contains essential info for the scanner to verify and act
    const payload = {
        type: "stamp",
        cardId: card.id,
        userId: card.userId,
        campaignId: card.campaignId,
        nonce: Date.now(),
    };

    const token = await signStampToken(payload);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10 px-4">
            <div className="w-full max-w-sm bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-indigo-600">
                    <h2 className="text-xl font-bold text-white text-center">{card.campaign.name}</h2>
                    <p className="text-indigo-200 text-sm text-center">{card.campaign.description}</p>
                </div>

                <div className="p-6 flex flex-col items-center">
                    <div className="mb-6 w-full">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm font-bold text-indigo-600">{card.stamps} / {card.campaign.stampsRequired}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-indigo-600 h-2.5 rounded-full"
                                style={{ width: `${Math.min((card.stamps / card.campaign.stampsRequired) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white p-4 border rounded-xl shadow-inner">
                        <QRCode value={token} size={200} />
                    </div>

                    <p className="mt-4 text-xs text-center text-gray-400">
                        Show this QR to the staff to get a stamp.
                        <br />
                        Token expires in 5 minutes. Refresh page to renew.
                    </p>
                </div>
            </div>

            <div className="mt-8">
                <Link href="/customer/wallet" className="text-indigo-600 font-medium hover:text-indigo-500">
                    &larr; Back to Wallet
                </Link>
            </div>
        </div>
    );
}
