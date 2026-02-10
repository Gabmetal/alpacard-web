import { db } from "@repo/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CampaignsPage() {
    const user = await currentUser();
    if (!user) return redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: user.id },
        include: { businessesOwned: true },
    });

    if (!dbUser || dbUser.businessesOwned.length === 0) {
        return redirect("/onboarding");
    }

    const business = dbUser.businessesOwned[0];
    const campaigns = await db.campaign.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div>
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Campaigns
                    </h2>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <Link
                        href="/dashboard/campaigns/new"
                        className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Create Campaign
                    </Link>
                </div>
            </div>

            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                        Name
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Status
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Stamps Required
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Edit</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {campaigns.map((campaign) => (
                                    <tr key={campaign.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                            {campaign.name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {campaign.isActive ? (
                                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {campaign.stampsRequired}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                            <Link href={`/dashboard/campaigns/${campaign.id}`} className="text-indigo-600 hover:text-indigo-900">
                                                Edit<span className="sr-only">, {campaign.name}</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {campaigns.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
                                No campaigns found. Create one to get started.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
