import { SignIn } from "@clerk/nextjs";

export default async function SignInPage({
    searchParams
}: {
    searchParams: Promise<{ redirect_url?: string }>
}) {
    const params = await searchParams;
    const redirectUrl = params.redirect_url;

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <SignIn fallbackRedirectUrl={redirectUrl || "/"} />
        </div>
    );
}
