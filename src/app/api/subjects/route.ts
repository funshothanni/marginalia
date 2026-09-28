import { NextResponse } from "next/server";
import { getSubjects } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const subjects = await getSubjects(
            user.id
        );

        return NextResponse.json({ subjects });
    } catch (error) {
        console.error("SUBJECTS ERROR:", error);

        return NextResponse.json(
            { error: "Failed to retrieve subjects" },
            { status: 500 }
        );
    }
}