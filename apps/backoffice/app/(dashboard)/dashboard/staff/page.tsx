import { db } from "@repo/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { removeStaff } from "../../../../actions/staff";
import StaffForm from "./staff-form";

export default async function StaffPage() {
    const user = await currentUser();
    if (!user) return redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: user.id },
        include: { businessesOwned: { include: { staff: true } } },
    });

    if (!dbUser || dbUser.businessesOwned.length === 0) {
        return redirect("/onboarding");
    }

    const business = dbUser.businessesOwned[0];
    const staffMembers = business.staff;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Staff Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Add staff members who can scan QR codes and issue stamps.
                    </p>
                </div>
            </div>

            <div className="mt-8">
                <div className="rounded-md bg-white p-6 shadow">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">Add Staff Member</h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>Enter the email address of the user you want to add. They must have an account first.</p>
                    </div>
                    <StaffForm />
                </div>
            </div>

            <div className="mt-8 flow-root">
                <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Current Staff</h3>
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                        Email
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Role
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Remove</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {staffMembers.map((member) => (
                                    <tr key={member.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                            {member.email}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {member.role}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                            <form action={removeStaff}>
                                                <input type="hidden" name="staffId" value={member.id} />
                                                <button type="submit" className="text-red-600 hover:text-red-900">Remove</button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {staffMembers.length === 0 && (
                            <div className="text-center py-6 text-gray-500 italic">
                                No staff members yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
