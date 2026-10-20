import { db } from "@/lib/db";
import { getSafeUser } from "@/lib/auth-wrapper";
import { redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";

interface PageProps {
    params: { id: string };
}

export default async function CampaignDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const user = await getSafeUser();
    if (!user) return redirect("/sign-in");

    const campaign = await db.campaign.findUnique({
        where: { id },
        include: { _count: { select: { cards: true } } },
    });

    if (!campaign) {
        return <div>Campaign not found</div>;
    }

    // Determine the PWA URL from env or fallback
    // Determine the App URL (Provider is now the host)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const claimUrl = `${appUrl}/customer/claim/${campaign.id}`;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        {campaign.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">{campaign.description}</p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <span className={
                        campaign.isActive
                            ? "inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
                            : "inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                    }>
                        {campaign.isActive ? "Active" : "Inactive"}
                    </span>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* QR Code Section */}
                <div className="rounded-lg bg-white shadow">
                    <div className="p-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            Acquisition QR Code
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Scan this QR code to get the digital card. Print this and place it in your store.
                        </p>
                        <div className="mt-6 flex justify-center bg-white p-4 border rounded-lg">
                            <QRCode value={claimUrl} size={200} />
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-xs text-gray-500 break-all">{claimUrl}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="rounded-lg bg-white shadow">
                    <div className="p-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            Stats
                        </h3>
                        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="overflow-hidden rounded-lg bg-gray-50 px-4 py-5 sm:p-6">
                                <dt className="truncate text-sm font-medium text-gray-500">
                                    Cards Issued
                                </dt>
                                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                                    {campaign._count.cards}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <Link
                    href="/dashboard/campaigns"
                    className="text-sm font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
                >
                    &larr; Back to Campaigns
                </Link>
            </div>
        </div>
    );
}
