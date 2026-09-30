import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const password =
            typeof body.password === "string"
                ? body.password
                : "";

        if (!password) {
            return Response.json(
                { error: "Password is required." },
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

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return Response.json(
                { error: "Unauthorized." },
                { status: 401 }
            );
        }

        const { error } = await supabase.auth.updateUser({
            password,
        });

        if (error) {
            console.error("Password update failed:", error);

            return Response.json(
                { error: "Unable to update password." },
                { status: 500 }
            );
        }

        return Response.json(
            { success: true },
            { status: 200 }
        );
    } catch {
        return Response.json(
            { error: "Unable to update password." },
            { status: 500 }
        );
    }
}