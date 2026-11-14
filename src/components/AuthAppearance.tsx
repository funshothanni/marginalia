"use client";

import type { ReactNode } from "react";
import WorkspaceThemeToggle from "@/components/WorkspaceThemeToggle";
import { useWorkspaceTheme } from "@/components/useWorkspaceTheme";
import styles from "./AuthAppearance.module.css";

export default function AuthAppearance({ children }: { children: ReactNode }) {
    const { theme, changeTheme } = useWorkspaceTheme();

    return (
        <main className={styles.page} data-theme={theme}>
            <WorkspaceThemeToggle theme={theme} onChange={changeTheme} />
            {children}
        </main>
    );
}
