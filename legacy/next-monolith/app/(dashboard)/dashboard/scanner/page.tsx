import { getSafeUser } from "@/lib/auth-wrapper";
import { redirect } from "next/navigation";
import ScannerClient from "./scanner-client";
import { Suspense } from "react";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ScannerPage({ searchParams }: PageProps) {
    const user = await getSafeUser();

    if (!user) {
        const sp = await searchParams;
        const token = sp.token;
        let returnUrl = "/dashboard/scanner";
        if (token) {
            // Reconstruct minimal query param
            returnUrl += `?token=${token}`;
        }

        // Redirect to sign in, with return URL back to scanner (with token)
        redirect(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
    }

    return (
        <Suspense fallback={<div>Loading scanner...</div>}>
            <ScannerClient />
        </Suspense>
    );
}
