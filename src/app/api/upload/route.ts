import { COURSE_SUBJECT_FORMAT_HINT, parseCourseSubject } from "../../../lib/courseSubject";
import { NextResponse } from "next/server";
import { ingestPdf } from "../../../lib/ingest";
import { getCurrentUser } from "../../../lib/auth";
import {DuplicateDocumentError} from "../../../lib/errors";

export async function POST(request: Request) {
    try{
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if(!(file instanceof File)) {
            return NextResponse.json(
                { error: "Please upload a file." },
                { status: 400 }
            );
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json(
                {error: "Only PDF files are supported."},
                {status: 400}
            );
        }

        const subject = formData.get("subject");
        const metadata = parseCourseSubject(subject);

        if (!metadata) {
            return NextResponse.json(
                { error: typeof subject !== "string" || !subject.trim()
                    ? "Please provide a subject."
                    : COURSE_SUBJECT_FORMAT_HINT },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const chunkCount = await ingestPdf(user.id, buffer, file.name, metadata);
        return NextResponse.json(
            {
                message: "PDF uploaded successfully.",
                count: chunkCount
            },

            { status: 200 }
        );
    }catch(error){
        console.error(error);

        if (error instanceof DuplicateDocumentError) {
            return NextResponse.json(
                { error: error.message },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            {status: 500}
        );
    }
}