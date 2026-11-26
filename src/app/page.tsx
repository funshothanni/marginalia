import { randomInt } from "node:crypto";
import { connection } from "next/server";
import PublicAppearance from "./PublicAppearance";
import PublicIntro from "./PublicIntro";
import styles from "./public.module.css";

// Each illustrative trio pairs the front course with its own symbols.
const courseStacks = [
    { front: "COMP 3360", middle: "STAT 2000", back: "LAW 1010", symbols: ["print''Hello World'' 💻 "] },
    { front: "ACCT 2020", middle: "MBIO 4350", back: "HEAL 1000", symbols: ["💵📉"] },
    { front: "MATH 1500", middle: "CHEM 1100", back: "HIST 1200", symbols: ["🔢➕"] },
    { front: "ECON 1020", middle: "MUSC 2000", back: "FMLY 1010", symbols: ["💲💰"] },
    { front: "NRSG 2020", middle: "PSYC 4350", back: "ENVR 1000", symbols: ["🩺🏥"] },
    { front: "PHYS 1500", middle: "FREN 1100", back: "ENGL 1200", symbols: ["🪐⚡"] },
    { front: "ENG 3030", middle: "FIN 4030", back: "KPER 1220", symbols: ["⚙️🚀"] },
];

export default async function Home() {
    await connection();
    // Pick once on the server so the labels and symbols stay in sync for this page.
    const index = randomInt(courseStacks.length);

    const front = courseStacks[index].front;
    const symbols = courseStacks[index].symbols;

    const middle = courseStacks[randomInt(courseStacks.length)].middle;
    const back = courseStacks[randomInt(courseStacks.length)].back;

    return (
        <PublicAppearance>
            <main className={styles.hero}>
                <PublicIntro href="/start-studying" />
                {/* The course labels are illustrative and never come from a student's account. */}
                <div className={styles.folderStack} role="img" aria-label={`three course folders: ${front}, ${middle}, and ${back}`}>
                    <div className={`${styles.folder} ${styles.backFolder}`}>{back}</div>
                    <div className={`${styles.folder} ${styles.middleFolder}`}>{middle}</div>
                    <div className={`${styles.folder} ${styles.frontFolder}`}>
                        {front}
                        <div className={styles.folderSymbols} aria-hidden="true">
                            {symbols.map((symbol) => <span key={symbol}>{symbol}</span>)}
                        </div>
                    </div>
                </div>
            </main>
        </PublicAppearance>
    );
}
