import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./public.module.css";

export default function PublicHeader({ isAbout = false, themeToggle }: {
    isAbout?: boolean;
    themeToggle?: ReactNode;
}) {
    return (
        <header className={styles.header}>
            <Link className={styles.wordmark} href="/">marginalia</Link>
            <nav className={styles.navigation} aria-label="main navigation">
                <Link href="/about" aria-current={isAbout ? "page" : undefined}>about</Link>
                <Link href="/login">log in</Link>
                <Link className={styles.signupLink} href="/signup">sign up</Link>
                {themeToggle}
            </nav>
        </header>
    );
}
