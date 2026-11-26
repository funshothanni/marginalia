import type { ReactNode } from "react";
import PublicAppearance from "@/app/PublicAppearance";
import PublicIntro from "@/app/PublicIntro";
import publicStyles from "@/app/public.module.css";
import styles from "./AuthAppearance.module.css";

export default function AuthAppearance({ children }: { children: ReactNode }) {
    return (
        <PublicAppearance className={styles.page}>
            <main className={`${publicStyles.hero} ${styles.layout}`}>
                <PublicIntro isPageHeading={false} />
                <div className={styles.formPanel}>{children}</div>
            </main>
        </PublicAppearance>
    );
}
