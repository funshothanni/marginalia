import styles from "./profile.module.css";

export default function SubjectFolders({ subjects }: { subjects: string[] }) {
    if (subjects.length === 0) {
        return <p className={styles.empty}>No saved subjects yet.</p>;
    }

    return (
        <ul className={styles.folders}>
            {subjects.map(subject => <li key={subject}>{subject}</li>)}
        </ul>
    );
}
