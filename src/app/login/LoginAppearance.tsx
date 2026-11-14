"use client";

import type { ReactNode } from "react";
import WorkspaceThemeToggle from "@/components/WorkspaceThemeToggle";
import { useWorkspaceTheme } from "@/components/useWorkspaceTheme";
import styles from "./page.module.css";

export default function LoginAppearance({ children }: { children: ReactNode }) {
    const { theme, changeTheme } = useWorkspaceTheme();

    return (
        <main className={styles.page} data-theme={theme}>
            <WorkspaceThemeToggle theme={theme} onChange={changeTheme} />
            {children}
        </main>
    );
}
