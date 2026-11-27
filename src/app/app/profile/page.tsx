import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSubjects } from "@/lib/db";
import { normalizeDisplayName } from "@/lib/displayName";
import { AVATAR_BUCKET, avatarPath } from "@/lib/profileAvatar";
import { createClient } from "@/lib/supabase/server";
import ProfileAccount from "./ProfileAccount";
import ProfileIdentity from "./ProfileIdentity";
import SubjectFolders from "./SubjectFolders";
import styles from "./profile.module.css";

const SUBJECT_PREVIEW_LIMIT = 4;

function formatMembership(createdAt: string) {
    const joined = new Date(createdAt);
    const now = new Date();
    const joinedLabel = new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(joined);
    const months = (now.getUTCFullYear() - joined.getUTCFullYear()) * 12
        + now.getUTCMonth() - joined.getUTCMonth()
        - Number(now.getUTCDate() < joined.getUTCDate());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const duration = months < 1 ? "less than a month" : [
        years > 0 ? `${years} ${years === 1 ? "year" : "years"}` : "",
        remainingMonths > 0 ? `${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}` : "",
    ].filter(Boolean).join(", ");
    return `member since ${joinedLabel} · ${duration}`;
}

export default async function ProfilePage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const supabase = await createClient();
    const [subjects, avatar] = await Promise.all([
        getSubjects(user.id),
        supabase.storage.from(AVATAR_BUCKET).createSignedUrl(avatarPath(user.id), 3600),
    ]);
    subjects.sort((left, right) => left.localeCompare(right));

    return (
        <>
            <h1>profile</h1>
            <ProfileIdentity
                userId={user.id}
                displayName={normalizeDisplayName(user.user_metadata.full_name)}
                avatarUrl={avatar.data?.signedUrl ?? null}
                membership={formatMembership(user.created_at)}
            />
            <div className={styles.sections}>
                <section aria-labelledby="profile-subjects-title">
                    <h2 id="profile-subjects-title">saved subjects</h2>
                    <SubjectFolders subjects={subjects.slice(0, SUBJECT_PREVIEW_LIMIT)} />
                    {subjects.length > SUBJECT_PREVIEW_LIMIT && (
                        <Link href="/app/profile/subjects" className={styles.button}>show more →</Link>
                    )}
                </section>
                <ProfileAccount email={user.email} />
            </div>
        </>
    );
}
