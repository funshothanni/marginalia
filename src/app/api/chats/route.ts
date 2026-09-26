import { NextRequest, NextResponse } from "next/server";
import { createChat, getChats, deleteChat } from "../../../lib/db";

export async function GET() {
    try {
        const chats = await getChats();

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
        const body = await request.json();
        const subject = body.subject;
        if (!subject) {
            return NextResponse.json(
                { error: "Subject is required" },
                { status: 400 }
            );
        }
        const chat = await createChat(subject);
        return NextResponse.json({ chat }, { status: 201 });
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

        await deleteChat(id);

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