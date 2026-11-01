"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        setLoading(true);

        const supabase = createClient();

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Logout failed:", error);
            setLoading(false);
            return;
        }

        router.replace("/login");
        router.refresh();
    }

    return (
        <button
            className="logoutButton"
            onClick={handleLogout}
            disabled={loading}
            type="button"
        >
            {loading ? "Logging out..." : "Log out"}
        </button>
    );
}