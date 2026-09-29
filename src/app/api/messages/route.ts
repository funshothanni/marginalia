import { NextRequest, NextResponse } from "next/server";
import { getChat, getMessages } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/auth";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        const chatId = request.nextUrl.searchParams.get("chatId");

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

        const chat = await getChat(user.id, id);
        if (!chat) {
            return NextResponse.json(
                { error: "Chat not found." },
                { status: 404 }
            );
        }

        const messages = await getMessages(user.id, id);
        return NextResponse.json({ messages });
    } catch (error) {
        console.error("GET MESSAGES ERROR:", error);

        return NextResponse.json(
            { error: "Failed to retrieve messages" },
            { status: 500 }
        );
    }
}