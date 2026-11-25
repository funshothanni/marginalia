import type { ReactNode } from "react";
import PublicHeader from "@/app/PublicHeader";
import PublicIntro from "@/app/PublicIntro";
import publicStyles from "@/app/public.module.css";
import styles from "./AuthAppearance.module.css";

export default function AuthAppearance({ children }: { children: ReactNode }) {
    return (
        <div className={`${publicStyles.site} ${styles.page}`}>
            <PublicHeader />
            <main className={`${publicStyles.hero} ${styles.layout}`}>
                <PublicIntro isPageHeading={false} />
                <div className={styles.formPanel}>{children}</div>
            </main>
        </div>
    );
}
