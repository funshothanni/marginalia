import { NextRequest, NextResponse } from "next/server";
import { getDocumentsBySubject, deleteDocument } from "../../../lib/db";

export async function GET(request: NextRequest) {
    try {
        const subject = request.nextUrl.searchParams.get("subject");

        if (!subject) {
            return NextResponse.json(
                { error: "Subject is required" },
                { status: 400 }
            );
        }

        const documents = await getDocumentsBySubject(subject);

        return NextResponse.json({ documents });
    } catch (error) {
        console.error("DOCUMENTS ERROR:", error);

        return NextResponse.json(
            { error: "Failed to retrieve documents" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const documentId = request.nextUrl.searchParams.get("id");

        if (!documentId) {
            return NextResponse.json(
                { error: "Document ID is required" },
                { status: 400 }
            );
        }

        const id = Number(documentId);

        if (!Number.isInteger(id)) {
            return NextResponse.json(
                { error: "Invalid document ID" },
                { status: 400 }
            );
        }

        await deleteDocument(id);

        return NextResponse.json({
            message: "Document deleted successfully"
        });
    } catch (error) {
        console.error("DELETE DOCUMENT ERROR:", error);

        return NextResponse.json(
            { error: "Failed to delete document" },
            { status: 500 }
        );
    }
}