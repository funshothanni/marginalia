import { normalizeDisplayName } from "../../../../lib/displayName";
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

        const displayName = normalizeDisplayName(body.displayName);
        // Older API callers may omit the name. Validate it when supplied.
        if (body.displayName !== undefined && !displayName) {
            return Response.json({ error: "Invalid display name." }, { status: 400 });
        }

        const supabase = await createClient();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            ...(displayName && { options: { data: { full_name: displayName } } }),
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