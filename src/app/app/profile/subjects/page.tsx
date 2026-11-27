import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSubjects } from "@/lib/db";
import SubjectFolders from "../SubjectFolders";
import styles from "../profile.module.css";

export default async function AllSubjectsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const subjects = (await getSubjects(user.id)).sort((left, right) => left.localeCompare(right));

    return (
        <>
            <Link href="/app/profile" className={styles.button}>← back to profile</Link>
            <h1>all subjects</h1>
            <SubjectFolders subjects={subjects} />
        </>
    );
}
