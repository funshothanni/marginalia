import { getCurrentUser } from "@/lib/auth";
import { normalizeDisplayName } from "@/lib/displayName";
import Workspace from "./Workspace";

export default async function Home() {
    const user = await getCurrentUser();
    const displayName = normalizeDisplayName(user?.user_metadata.full_name);

    return <Workspace displayName={displayName} />;
}
