import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "../../../lib/db";

export async function GET(request: NextRequest) {
    try {
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

        const messages = await getMessages(id);

        return NextResponse.json({ messages });
    } catch (error) {
        console.error("GET MESSAGES ERROR:", error);

        return NextResponse.json(
            { error: "Failed to retrieve messages" },
            { status: 500 }
        );
    }
}