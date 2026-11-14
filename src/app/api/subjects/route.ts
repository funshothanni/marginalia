import { NextResponse } from "next/server";
import { deleteSubject, getSubjects } from "../../../lib/db";
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

export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const subject = new URL(request.url).searchParams.get("subject");
        if (!subject?.trim()) {
            return NextResponse.json({ error: "select a subject to delete." }, { status: 400 });
        }

        await deleteSubject(subject);
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error("Failed to delete subject:", error);
        return NextResponse.json({ error: "could not delete the subject." }, { status: 500 });
    }
}
