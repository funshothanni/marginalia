import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);

    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;

    if (!tokenHash || !type) {
        return NextResponse.redirect(
            `${origin}/login?error=invalid_confirmation_link`
        );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
    });

    if (error) {
        console.error("Email confirmation failed:", error);

        return NextResponse.redirect(
            `${origin}/login?error=email_confirmation_failed`
        );
    }

    return NextResponse.redirect(`${origin}/app`);
}