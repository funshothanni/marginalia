"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function ResetPasswordPage() {
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleResetPassword(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError(
                "Password must be at least 6 characters."
            );
            return;
        }

        setLoading(true);

        const supabase = createClient();

        const { error } = await supabase.auth.updateUser({
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        // End the recovery session after changing the password.
        await supabase.auth.signOut();

        router.replace("/login?password_reset=success");
        router.refresh();
    }

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>Choose a new password</h1>

                    <p>
                        Enter a new password for your
                        Marginalia account.
                    </p>
                </div>

                <form
                    onSubmit={handleResetPassword}
                    className={styles.form}
                >
                    <div className={styles.field}>
                        <label htmlFor="password">
                            New password
                        </label>

                        <input
                            id="password"
                            type="password"
                            placeholder="Enter a new password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="confirmPassword">
                            Confirm new password
                        </label>

                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Enter your password again"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(
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

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading
                            ? "Updating password..."
                            : "Update password"}
                    </button>
                </form>
            </div>
        </main>
    );
}