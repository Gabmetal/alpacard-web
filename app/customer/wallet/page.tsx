import { db } from "@/lib/db";
import { getSafeUser } from "@/lib/auth-wrapper";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard } from "lucide-react";

export default async function WalletPage() {
    const user = await getSafeUser();
    if (!user) return redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: user.id },
    });

    if (!dbUser) {
        // Should not happen if they went through claim flow, but handling edge case
        return <div>User not found. Please scan a campaign QR code first.</div>;
    }

    const cards = await db.card.findMany({
        where: { userId: dbUser.id },
        include: { campaign: true },
        orderBy: { updatedAt: "desc" },
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white shadow">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Wallet</h1>
                </div>
            </header>
            <main>
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {cards.length === 0 ? (
                        <div className="text-center py-12">
                            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">No cards yet</h3>
                            <p className="mt-1 text-sm text-gray-500">Scan a QR code from a store to add a card.</p>
                        </div>
                    ) : (
                        <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {cards.map((card) => (
                                <li key={card.id} className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
                                    <div className="flex w-full items-center justify-between space-x-6 p-6">
                                        <div className="flex-1 truncate">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="truncate text-sm font-medium text-gray-900">{card.campaign.name}</h3>
                                                <span className="inline-flex flex-shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                    {card.stamps} / {card.campaign.stampsRequired} stamps
                                                </span>
                                            </div>
                                            <p className="mt-1 truncate text-sm text-gray-500">{card.campaign.description}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="-mt-px flex divide-x divide-gray-200">
                                            <div className="flex w-0 flex-1">
                                                <Link
                                                    href={`/customer/wallet/${card.id}`}
                                                    className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 hover:text-gray-700"
                                                >
                                                    View Card
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}
