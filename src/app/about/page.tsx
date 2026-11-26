import type { Metadata } from "next";
import PublicAppearance from "../PublicAppearance";
import styles from "../public.module.css";

export const metadata: Metadata = { title: "about marginalia" };

export default function About() {
    return (
        <PublicAppearance isAbout>
            <main className={styles.about}>
                <h1>marginalia</h1>
                <p>marginalia helps you study from the course pdfs you upload.</p>

                <section aria-labelledby="how-it-works">
                    <h2 id="how-it-works">how it works</h2>
                    <ol>
                        <li>choose a course to keep its notes together.</li>
                        <li>upload the pdfs you want to study.</li>
                        <li>ask a question about one pdf or the course notes.</li>
                    </ol>
                </section>

                {/* A static example shows a follow-up without implying a live demo. */}
                <section aria-labelledby="example-chat">
                    <h2 id="example-chat">example chat</h2>
                    <div className={styles.example}>
                        <p className={styles.prompt}>what does lecture 25 talk about?</p>
                        <p>it explains how a b-tree index keeps keys ordered and speeds up lookups.</p>
                        <p className={styles.prompt}>can you explain that more simply?</p>
                        <p>keeping the keys in order helps the database narrow down where to look.</p>
                        <p className={styles.prompt}>what of supercalifragilisticexpialidocious?</p>
                        <p>i couldn&#39;t find enough information in your uploaded materials to answer that.</p>
                    </div>
                </section>
            </main>
        </PublicAppearance>
    );
}
