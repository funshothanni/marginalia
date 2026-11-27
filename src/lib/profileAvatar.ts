export const AVATAR_BUCKET = "profile-avatars";
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function avatarPath(userId: string) {
    return `${userId}/portrait`;
}
