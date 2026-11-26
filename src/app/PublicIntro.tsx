import Link from "next/link";
import styles from "./public.module.css";

export default function PublicIntro({ href = "/signup", isPageHeading = true }: {
    href?: string;
    isPageHeading?: boolean;
}) {
    // Account pages already have a heading that names the current form.
    const Headline = isPageHeading ? "h1" : "p";

    return (
        <div>
            <Headline className={styles.headline}>
                <span>notes</span>
                <span>that talk</span>
                <span>back…</span>
            </Headline>
            {href === "/start-studying" ? (
                <a className={styles.primaryLink} href={href}>start studying…</a>
            ) : (
                <Link className={styles.primaryLink} href={href}>start studying…</Link>
            )}
        </div>
    );
}
