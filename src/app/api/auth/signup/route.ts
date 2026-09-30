import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const email =
            typeof body.email === "string"
                ? body.email.trim()
                : "";

        const password =
            typeof body.password === "string"
                ? body.password
                : "";

        if (!email || !password) {
            return Response.json(
                { error: "Email and password are required." },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return Response.json(
                {
                    error: "Password must be at least 8 characters.",
                },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return Response.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return Response.json(
            {
                success: true,
                requiresEmailConfirmation: !data.session,
            },
            { status: 201 }
        );
    } catch {
        return Response.json(
            { error: "Unable to create account." },
            { status: 500 }
        );
    }
}