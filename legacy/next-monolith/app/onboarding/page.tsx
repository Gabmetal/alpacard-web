"use client";

import { useActionState } from "react";
import { createBusiness } from "../../actions/business";

const initialState = {
    message: "",
};

export default function OnboardingPage() {
    const [state, formAction] = useActionState(createBusiness, initialState);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create your Business
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Let&apos;s get started with your loyalty program.
                    </p>
                </div>
                <form className="mt-8 space-y-6" action={formAction}>
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="name" className="sr-only">
                                Business Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
                                placeholder="Business Name"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Create Business
                        </button>
                    </div>
                    {state?.message && (
                        <p className="text-red-500 text-sm text-center">{state.message}</p>
                    )}
                </form>
            </div>
        </div>
    );
}
