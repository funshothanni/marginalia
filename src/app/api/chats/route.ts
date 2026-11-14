import { COURSE_SUBJECT_FORMAT_HINT, parseCourseSubject } from "../../../lib/courseSubject";
import { NextRequest, NextResponse } from "next/server";
import { createChat, getChats, deleteChat } from "../../../lib/db";
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

        const chats = await getChats(user.id);
        return NextResponse.json({ chats });
    } catch (error) {
        console.error("GET CHATS ERROR:", error);

        return NextResponse.json(
            { error: "Failed to retrieve chats" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const courseSubject = parseCourseSubject(body.subject);

        if (!courseSubject) {
            return NextResponse.json(
                { error: body.subject ? COURSE_SUBJECT_FORMAT_HINT : "Subject is required" },
                { status: 400 }
            );
        }

        const chat = await createChat(
            user.id,
            courseSubject.subject
        );

        return NextResponse.json(
            { chat },
            { status: 201 }
        );
    } catch (error) {
        console.error("CREATE CHAT ERROR:", error);

        return NextResponse.json(
            { error: "Failed to create chat" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const chatId = request.nextUrl.searchParams.get("id");

        if (!chatId) {
            return NextResponse.json(
                { error: "Chat ID is required" },
                { status: 400 }
            );
        }

        const id = Number(chatId);

        if (!Number.isInteger(id)) {
            return NextResponse.json(
                { error: "Invalid chat ID" },
                { status: 400 }
            );
        }

        await deleteChat(user.id, id);
        return NextResponse.json({
            message: "Chat deleted successfully"
        });
    } catch (error) {
        console.error("DELETE CHAT ERROR:", error);

        return NextResponse.json(
            { error: "Failed to delete chat" },
            { status: 500 }
        );
    }
}