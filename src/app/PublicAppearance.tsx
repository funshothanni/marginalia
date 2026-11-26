"use client";

import type { ReactNode } from "react";
import WorkspaceThemeToggle from "@/components/WorkspaceThemeToggle";
import { useWorkspaceTheme } from "@/components/useWorkspaceTheme";
import PublicHeader from "./PublicHeader";
import styles from "./public.module.css";

export default function PublicAppearance({ children, className, isAbout }: {
    children: ReactNode;
    className?: string;
    isAbout?: boolean;
}) {
    // Share the saved theme with the workspace so navigation keeps the same preference.
    const { theme, changeTheme } = useWorkspaceTheme();

    return (
        <div className={className ? `${styles.site} ${className}` : styles.site} data-public-theme={theme}>
            <PublicHeader isAbout={isAbout} themeToggle={<WorkspaceThemeToggle theme={theme} onChange={changeTheme} inline />} />
            {children}
        </div>
    );
}
