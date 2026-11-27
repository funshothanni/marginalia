"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MAX_DISPLAY_NAME_LENGTH, normalizeDisplayName } from "@/lib/displayName";
import { AVATAR_BUCKET, AVATAR_TYPES, MAX_AVATAR_BYTES, avatarPath } from "@/lib/profileAvatar";
import { createClient } from "@/lib/supabase/client";
import styles from "./profile.module.css";

export default function ProfileIdentity({ userId, displayName, avatarUrl, membership }: {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    membership: string;
}) {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState("");
    const initials = displayName.split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join("").toUpperCase();

    async function saveName(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = normalizeDisplayName(new FormData(event.currentTarget).get("displayName"));
        if (!name) {
            setStatus(`Enter a display name up to ${MAX_DISPLAY_NAME_LENGTH} characters.`);
            return;
        }
        setBusy(true);
        setStatus("");
        try {
            const { error } = await createClient().auth.updateUser({ data: { full_name: name } });
            if (error) throw error;
            router.refresh();
            setStatus("Display name saved.");
        } catch {
            setStatus("Could not save your display name. Try again.");
        } finally {
            setBusy(false);
        }
    }

    async function changePhoto(file?: File) {
        if (file && (!AVATAR_TYPES.includes(file.type) || file.size > MAX_AVATAR_BYTES || file.size === 0)) {
            setStatus("Choose a JPEG, PNG, or WebP image up to 5 MB.");
            return;
        }
        setBusy(true);
        setStatus("");
        const storage = createClient().storage.from(AVATAR_BUCKET);
        const path = avatarPath(userId);
        try {
            const { error } = file
                ? await storage.upload(path, file, { upsert: true, cacheControl: "0" })
                : await storage.remove([path]);
            if (error) throw error;
            router.refresh();
            setStatus(file ? "Profile photo saved." : "Profile photo removed.");
        } catch {
            setStatus("Could not update your profile photo. Try again.");
        } finally {
            setBusy(false);
        }
    }

    function uploadPhoto(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const file = new FormData(event.currentTarget).get("photo");
        if (!(file instanceof File) || !file.name) {
            setStatus("Choose a photo to upload.");
            return;
        }
        void changePhoto(file);
    }

    return (
        <section aria-label="profile details">
            <div className={styles.identity}>
                <div className={styles.avatar}>
                    {avatarUrl ? (
                        <Image src={avatarUrl} alt="Profile photo" width={104} height={104} unoptimized />
                    ) : (
                        <span aria-hidden="true">{initials || "M"}</span>
                    )}
                </div>
                <div className={styles.identityText}>
                    <h2>{displayName || "Marginalia member"}</h2>
                    <p>{membership}</p>
                </div>
                <button
                    className={styles.button}
                    type="button"
                    aria-expanded={editing}
                    aria-controls="profile-editor"
                    disabled={busy}
                    onClick={() => { setEditing(!editing); setStatus(""); }}
                >
                    {editing ? "done" : "edit profile"}
                </button>
            </div>
            {editing && (
                <div className={styles.editor} id="profile-editor">
                    <form onSubmit={saveName} className={styles.editForm}>
                        <label htmlFor="profile-name">display name</label>
                        <input id="profile-name" name="displayName" defaultValue={displayName} maxLength={MAX_DISPLAY_NAME_LENGTH} required disabled={busy} />
                        <button className={styles.button} disabled={busy}>save name</button>
                    </form>
                    <form onSubmit={uploadPhoto} className={styles.editForm}>
                        <label htmlFor="profile-photo">profile photo</label>
                        <input id="profile-photo" name="photo" type="file" accept={AVATAR_TYPES.join(",")} disabled={busy} />
                        <div className={styles.photoActions}>
                            <button className={styles.button} disabled={busy}>upload photo</button>
                            {avatarUrl && (
                                <button className={styles.button} type="button" disabled={busy} onClick={() => void changePhoto()}>
                                    remove photo
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
            <p role="status" className={styles.status}>{status}</p>
        </section>
    );
}
