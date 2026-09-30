import { createClient } from "../../../../lib/supabase/server";

export async function POST() {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.signOut();

        if (error) {
            return Response.json(
                { error: "Unable to sign out." },
                { status: 500 }
            );
        }

        return Response.json(
            { success: true },
            { status: 200 }
        );
    } catch {
        return Response.json(
            { error: "Unable to sign out." },
            { status: 500 }
        );
    }
}