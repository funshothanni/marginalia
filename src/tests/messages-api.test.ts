import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/messages/route";
import { getMessages } from "../lib/db";

vi.mock("../lib/db", () => ({
    getMessages: vi.fn(),
}));

const mockGetMessages = vi.mocked(getMessages);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("GET /api/messages", () => {
    test("returns messages for a chat", async () => {
        const fakeMessages = [
            {
                id: 1,
                chat_id: 7,
                role: "user" as const,
                content: "What is a binary tree?",
                created_at: "2026-09-22T12:00:00Z",
            },
            {
                id: 2,
                chat_id: 7,
                role: "assistant" as const,
                content: "A binary tree is...",
                created_at: "2026-09-22T12:00:01Z",
            },
        ];

        mockGetMessages.mockResolvedValueOnce(fakeMessages);

        const request = new NextRequest(
            "http://localhost/api/messages?chatId=7"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(mockGetMessages).toHaveBeenCalledWith(7);
        expect(data).toEqual({
            messages: fakeMessages,
        });
    });

    test("returns 400 when chat ID is missing", async () => {
        const request = new NextRequest(
            "http://localhost/api/messages"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
            error: "Chat ID is required",
        });

        expect(mockGetMessages).not.toHaveBeenCalled();
    });

    test("returns 400 when chat ID is invalid", async () => {
        const request = new NextRequest(
            "http://localhost/api/messages?chatId=abc"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
            error: "Invalid chat ID",
        });

        expect(mockGetMessages).not.toHaveBeenCalled();
    });

    test("returns 500 when retrieving messages fails", async () => {
        mockGetMessages.mockRejectedValueOnce(
            new Error("Database unavailable")
        );

        const request = new NextRequest(
            "http://localhost/api/messages?chatId=7"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
            error: "Failed to retrieve messages",
        });
    });
});