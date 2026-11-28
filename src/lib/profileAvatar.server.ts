import { AVATAR_BUCKET, avatarPath } from "./profileAvatar";
import { createClient } from "./supabase/server";

export async function getProfileAvatarUrl(userId: string): Promise<string | null> {
    const supabase = await createClient();
    const { data } = await supabase.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(avatarPath(userId), 3600);

    return data?.signedUrl ?? null;
}
