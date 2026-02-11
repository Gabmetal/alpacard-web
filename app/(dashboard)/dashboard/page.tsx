import { db } from "@/lib/db";
import { getSafeUser } from "@/lib/auth-wrapper";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
    const user = await getSafeUser();
    if (!user) return redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: user.id },
        include: { businessesOwned: true },
    });

    if (!dbUser || dbUser.businessesOwned.length === 0) {
        return redirect("/onboarding");
    }

    const business = dbUser.businessesOwned[0];

    // Fetch Metrics
    const campaignCount = await db.campaign.count({
        where: { businessId: business.id },
    });

    const staffData = await db.business.findUnique({
        where: { id: business.id },
        include: { _count: { select: { staff: true } } },
    });
    const staffCount = staffData?._count.staff ?? 0;

    const cardCount = await db.card.count({
        where: { campaign: { businessId: business.id } },
    });

    const stampData = await db.card.aggregate({
        where: { campaign: { businessId: business.id } },
        _sum: { stamps: true },
    });
    const totalStamps = stampData._sum.stamps ?? 0;

    const stats = [
        { name: 'Active Campaigns', stat: campaignCount, url: '/dashboard/campaigns' },
        { name: 'Staff Members', stat: staffCount, url: '/dashboard/staff' },
        { name: 'Digital Cards Issued', stat: cardCount },
        { name: 'Total Stamps Issued', stat: totalStamps },
    ];

    return (
        <div>
            <h3 className="text-base font-semibold leading-6 text-gray-900">Last 30 days</h3>
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <div key={item.name} className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                        <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
                        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{item.stat}</dd>
                        {item.url && (
                            <div className="mt-2">
                                <Link href={item.url} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                    View all
                                </Link>
                            </div>
                        )}
                    </div>
                ))}
            </dl>
        </div>
    );
}
