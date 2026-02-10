"use client";

import { useActionState } from "react";
import { createCampaign } from "../../../../../actions/campaign";
import Link from "next/link";

const initialState = {
    message: "",
};

export default function NewCampaignPage() {
    const [state, formAction, isPending] = useActionState(createCampaign, initialState);

    return (
        <div className="max-w-2xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Create Campaign
                    </h2>
                </div>
            </div>

            <form action={formAction} className="space-y-6 bg-white shadow sm:rounded-lg p-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                        Campaign Name
                    </label>
                    <div className="mt-2">
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
                            placeholder="e.g. Coffee Loyalty"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                        Description
                    </label>
                    <div className="mt-2">
                        <textarea
                            name="description"
                            id="description"
                            required
                            rows={3}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
                            placeholder="Buy 8 coffees, get 1 free!"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="stampsRequired" className="block text-sm font-medium leading-6 text-gray-900">
                        Stamps Required
                    </label>
                    <div className="mt-2">
                        <input
                            type="number"
                            name="stampsRequired"
                            id="stampsRequired"
                            required
                            min="1"
                            defaultValue="10"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-x-3">
                    <Link
                        href="/dashboard/campaigns"
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {isPending ? "Creating..." : "Create Campaign"}
                    </button>
                </div>
                {state?.message && (
                    <p className="text-red-500 text-sm">{state.message}</p>
                )}
            </form>
        </div>
    );
}
