"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleReset(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setMessage("");
        setLoading(true);

        const supabase = createClient();

        const { error } =
            await supabase.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: `${window.location.origin}/auth/reset-password`,
                }
            );

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setMessage(
            "Check your email for a password reset link."
        );

        setLoading(false);
    }

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>reset your password</h1>

                    <p>
                        enter your email and we&#39;ll send you
                        a password reset link.
                    </p>
                </div>

                <form
                    onSubmit={handleReset}
                    className={styles.form}
                >
                    <div className={styles.field}>
                        <label htmlFor="email">
                            email
                        </label>

                        <input
                            id="email"
                            type="email"
                            placeholder="marginalia@study.my"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    {error && (
                        <p className={styles.error}>
                            {error}
                        </p>
                    )}

                    {message && (
                        <p className={styles.success}>
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading
                            ? "sending..."
                            : "send reset link"}
                    </button>
                </form>

                <p className={styles.footer}>
                    <a href="/login">
                        sign in
                    </a>
                </p>
            </div>
        </main>
    );
}