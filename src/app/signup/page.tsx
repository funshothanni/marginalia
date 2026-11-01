"use client";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSignup(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setMessage("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        const supabase = createClient();

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/confirm`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setMessage("Check your email to confirm your account.");
        setLoading(false);
    }

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>create your account</h1>
                    <p>start studying with marginalia.</p>
                </div>

                {message ? (
                    <>
                        <div className={styles.confirmation}>
                            <p className={styles.success}>
                                {message}
                            </p>
                        </div>

                        <p className={styles.footer}>
                            already have an account?{" "}
                            <a href="/login">sign in</a>
                        </p>
                    </>
                ) : (
                    <>
                        <form
                            onSubmit={handleSignup}
                            className={styles.form}
                        >
                            <div className={styles.field}>
                                <label htmlFor="email">
                                    email
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    placeholder="marginalia@my.com"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="password">
                                    password
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    placeholder="create a password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="confirmPassword">
                                    confirm password
                                </label>

                                <input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="enter your password again"
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
                                    ? "creating account..."
                                    : "create account"}
                            </button>
                        </form>

                        <p className={styles.footer}>
                            already have an account?{" "}
                            <a href="/login">sign in</a>
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}