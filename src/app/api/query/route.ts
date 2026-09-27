import { NextResponse } from "next/server";
import { askQuestion } from "../../../lib/rag";
import { createMessage, getChat, getMessages, updateChatTitle, updateChatTimestamp } from "../../../lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const question = body.question;
        const subject = body.subject;
        const chatId = body.chatId;

        if (typeof question !== "string" || question.trim().length === 0) {
            return NextResponse.json(
                { error: "Please provide a question." },
                { status: 400 }
            );
        }
        if (typeof subject !== "string" || subject.trim().length === 0) {
            return NextResponse.json(
                { error: "Please provide a subject." },
                { status: 400 }
            );
        }

        if (!Number.isInteger(chatId)) {
            return NextResponse.json(
                { error: "Valid chat ID is required." },
                { status: 400 }
            );
        }

        const chat = await getChat(chatId);

        if (!chat) {
            return NextResponse.json(
                { error: "Chat not found." },
                { status: 404 }
            );
        }

        if (chat.title === "New Chat") {
            const title =
                question.trim().length > 50 ? `${question.trim().slice(0, 50)}...` : question.trim();
            await updateChatTitle(chatId, title);
        }

        const conversationHistory = await getMessages(chatId);
        await createMessage(chatId, "user", question.trim());
        // @ts-ignore
        const answer = await askQuestion(question.trim(), chat.subject, conversationHistory);
        await createMessage( chatId, "assistant", answer);
        await updateChatTimestamp(chatId);

        return NextResponse.json({ answer });
    } catch (error) {
        console.error("QUERY ERROR:", error);

        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}