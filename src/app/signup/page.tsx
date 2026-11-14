"use client";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MAX_DISPLAY_NAME_LENGTH, normalizeDisplayName } from "@/lib/displayName";
import AuthAppearance from "@/components/AuthAppearance";
import styles from "./page.module.css";

export default function SignupPage() {
    const [displayName, setDisplayName] = useState("");
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

        const name = normalizeDisplayName(displayName);
        if (!name) {
            setError(`Enter a display name up to ${MAX_DISPLAY_NAME_LENGTH} characters.`);
            return;
        }

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
                // Supabase Auth uses full_name metadata for the dashboard display name.
                data: { full_name: name },
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
        <AuthAppearance>
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
                                <label htmlFor="displayName">display name</label>
                                <input
                                    id="displayName"
                                    type="text"
                                    autoComplete="nickname"
                                    maxLength={MAX_DISPLAY_NAME_LENGTH}
                                    value={displayName}
                                    onChange={(event) => setDisplayName(event.target.value)}
                                    required
                                />
                            </div>

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
        </AuthAppearance>
    );
}