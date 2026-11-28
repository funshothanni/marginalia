import { getCurrentUser } from "@/lib/auth";
import { normalizeDisplayName } from "@/lib/displayName";
import { getProfileAvatarUrl } from "@/lib/profileAvatar.server";
import Workspace from "./Workspace";

export default async function Home() {
    const user = await getCurrentUser();
    const displayName = normalizeDisplayName(user?.user_metadata.full_name);

    const avatarUrl = user ? await getProfileAvatarUrl(user.id) : null;

    return <Workspace displayName={displayName} avatarUrl={avatarUrl} />;
}
