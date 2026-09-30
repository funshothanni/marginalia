import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const email =
            typeof body.email === "string"
                ? body.email.trim()
                : "";

        if (!email) {
            return Response.json(
                { error: "Email is required." },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { error } = await supabase.auth.resetPasswordForEmail(
            email,
            {
                redirectTo:
                    "http://localhost:3000/auth/reset-password",
            }
        );

        if (error) {
            console.error("Password reset request failed:", error);

            return Response.json(
                { error: "Unable to send password reset email." },
                { status: 500 }
            );
        }

        return Response.json(
            {
                success: true,
                message:
                    "If an account exists for that email, a password reset link has been sent.",
            },
            { status: 200 }
        );
    } catch {
        return Response.json(
            { error: "Unable to send password reset email." },
            { status: 500 }
        );
    }
}