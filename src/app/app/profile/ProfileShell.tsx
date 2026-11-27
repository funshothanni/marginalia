"use client";

import type { ReactNode } from "react";
import { useWorkspaceTheme } from "@/components/useWorkspaceTheme";
import publicStyles from "../../public.module.css";
import SignedInHeader from "../SignedInHeader";
import styles from "./profile.module.css";

export default function ProfileShell({ children }: { children: ReactNode }) {
    const { theme, changeTheme } = useWorkspaceTheme();

    return (
        <div className={publicStyles.site} data-public-theme={theme}>
            <SignedInHeader active="profile" theme={theme} onThemeChange={changeTheme} />
            <main className={styles.main}>{children}</main>
        </div>
    );
}
