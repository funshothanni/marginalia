import { cache } from "react";
import { createClient } from "./supabase/server";

// Share the verified user lookup between the protected layout and its page.
export const getCurrentUser = cache(async function getCurrentUser() {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return user;
});
