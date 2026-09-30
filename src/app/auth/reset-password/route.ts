import { createClient } from "../../../lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);

    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!tokenHash || type !== "recovery") {
        return NextResponse.redirect(
            `${origin}/login?error=invalid_recovery_link`
        );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
    });

    if (error) {
        console.error("Password recovery verification failed:", error);

        return NextResponse.redirect(
            `${origin}/login?error=password_recovery_failed`
        );
    }

    return NextResponse.redirect(
        `${origin}/reset-password`
    );
}