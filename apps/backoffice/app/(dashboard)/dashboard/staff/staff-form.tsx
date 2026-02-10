"use client";

import { useActionState } from "react";
import { addStaff } from "../../../../actions/staff";

const initialState = {
    message: "",
    success: false,
};

export default function StaffForm() {
    const [state, formAction, isPending] = useActionState(addStaff, initialState);

    return (
        <form action={formAction} className="mt-5 sm:flex sm:items-center">
            <div className="w-full sm:max-w-xs">
                <label htmlFor="email" className="sr-only">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    id="email"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
                    placeholder="you@example.com"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={isPending}
                className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:mt-0 sm:w-auto disabled:opacity-50"
            >
                {isPending ? "Adding..." : "Add Staff"}
            </button>
            {state?.message && !state.success && (
                <p className="mt-2 text-sm text-red-600 sm:ml-4">{state.message}</p>
            )}
            {state?.success && (
                <p className="mt-2 text-sm text-green-600 sm:ml-4">{state.message}</p>
            )}
        </form>
    );
}
