"use client";

import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/client";
import styles from "./profile.module.css";

export default function ProfileAccount({ email }: { email: string | undefined }) {
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState("");

    async function sendResetLink() {
        if (!email) return;
        setSending(true);
        setStatus("");
        try {
            const { error } = await createClient().auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });
            if (error) throw error;
            setStatus("Check your email for the password reset link.");
        } catch {
            setStatus("Could not send the reset link. Try again.");
        } finally {
            setSending(false);
        }
    }

    return (
        <section aria-labelledby="profile-account-title">
            <h2 id="profile-account-title">account information</h2>
            <div className={styles.account}>
                <dl>
                    <dt>email</dt>
                    <dd>{email ?? "No email on this account."}</dd>
                </dl>
                <div className={styles.accountRow}>
                    <h3>password</h3>
                    <button className={styles.button} type="button" disabled={sending || !email} onClick={sendResetLink}>
                        {sending ? "sending link…" : "reset password"}
                    </button>
                    <p role="status" className={styles.status}>{status}</p>
                </div>
                <div className={styles.accountRow}>
                    <LogoutButton />
                </div>
            </div>
        </section>
    );
}
