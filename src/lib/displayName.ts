export const MAX_DISPLAY_NAME_LENGTH = 80;

export function normalizeDisplayName(value: unknown): string {
    if (typeof value !== "string") {
        return "";
    }

    const name = value.trim();
    return name.length <= MAX_DISPLAY_NAME_LENGTH ? name : "";
}
