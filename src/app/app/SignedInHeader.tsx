"use client";

import Link from "next/link";
import WorkspaceThemeToggle from "@/components/WorkspaceThemeToggle";
import type { WorkspaceTheme } from "@/components/useWorkspaceTheme";
import styles from "../public.module.css";

export default function SignedInHeader({ active, theme, onThemeChange }: {
    active: "workspace" | "profile";
    theme: WorkspaceTheme;
    onThemeChange: (theme: WorkspaceTheme) => void;
}) {
    return (
        <header className={styles.header} style={{ color: theme === "dark" ? "var(--gold)" : "var(--ink)" }}>
            <Link className={styles.wordmark} href="/app">marginalia</Link>
            <nav className={styles.navigation} aria-label="main navigation">
                <Link href="/app" aria-current={active === "workspace" ? "page" : undefined}>workspace</Link>
                <Link href="/app/profile" aria-current={active === "profile" ? "page" : undefined}>profile</Link>
                <WorkspaceThemeToggle theme={theme} onChange={onThemeChange} inline />
            </nav>
        </header>
    );
}
