const COURSE_SUBJECT_PATTERN = /^([A-Z]{2,4})\s*([0-9]{3,4})$/;

export const COURSE_SUBJECT_FORMAT_HINT = "use 2–4 letters and 3–4 digits (e.g. COMP 2000).";

export function parseCourseSubject(value: unknown): { subject: string; course: string; code: string } | null {
    if (typeof value !== "string") {
        return null;
    }

    const match = COURSE_SUBJECT_PATTERN.exec(value.trim().toUpperCase());
    if (!match) {
        return null;
    }

    const [, course, code] = match;
    // Keep the full label as the exact lookup key and preserve leading zeroes in the code.
    return { subject: `${course} ${code}`, course, code };
}
