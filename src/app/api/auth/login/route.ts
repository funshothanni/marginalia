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

        const supabase = await createClient();

        const { error } =
            await supabase.auth.signInWithPassword({
                email,
                password,
            });

        if (error) {
            return Response.json(
                { error: "Invalid email or password." },
                { status: 401 }
            );
        }

        return Response.json(
            { success: true },
            { status: 200 }
        );
    } catch {
        return Response.json(
            { error: "Unable to sign in." },
            { status: 500 }
        );
    }
}