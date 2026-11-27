import type { ReactNode } from "react";
import ProfileShell from "./ProfileShell";

export default function ProfileLayout({ children }: { children: ReactNode }) {
    return <ProfileShell>{children}</ProfileShell>;
}
