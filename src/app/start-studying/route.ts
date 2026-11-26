import { getCurrentUser } from "@/lib/auth";

export async function GET() {
    const user = await getCurrentUser();

    return new Response(null, {
        status: 307,
        headers: {
            Location: user ? "/app" : "/signup",
            // Check the session on every click so Safari never reuses a
            // redirect to sign-up from before the user logged in.
            "Cache-Control": "private, no-store",
        },
    });
}
