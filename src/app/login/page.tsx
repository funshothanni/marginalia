"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setLoading(true);

        const supabase = createClient();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        router.push("/app");
        router.refresh();
    }

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>marginalia</h1>
                    <p>log in to continue studying.</p>
                </div>

                <form
                    onSubmit={handleLogin}
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
                            placeholder="enter your password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                        />
                    </div>

                    <div className={styles.forgotPassword}>
                        <a href="/forgot-password">
                            forgot password?
                        </a>
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
                            ? "logging in..."
                            : "log in"}
                    </button>
                </form>

                <p className={styles.footer}>
                    don&#39;t have an account?{" "}
                    <a href="/signup">sign up</a>
                </p>
            </div>
        </main>
    );
}