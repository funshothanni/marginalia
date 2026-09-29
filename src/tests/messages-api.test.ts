import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/messages/route";
import { getChat, getMessages } from "../lib/db";
import { getCurrentUser } from "../lib/auth";

vi.mock("../lib/db", () => ({
    getChat: vi.fn(),
    getMessages: vi.fn(),
}));

vi.mock("../lib/auth", () => ({
    getCurrentUser: vi.fn(),
}));

const mockGetChat = vi.mocked(getChat);
const mockGetMessages = vi.mocked(getMessages);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

beforeEach(() => {
    vi.clearAllMocks();

    mockGetCurrentUser.mockResolvedValue({
        id: "test-user-id",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: "2026-09-27T00:00:00Z",
    });

    mockGetChat.mockResolvedValue({
        id: 7,
        title: "New Chat",
        subject: "COMP",
        created_at: "2026-09-22T12:00:00Z",
        updated_at: "2026-09-22T12:00:00Z",
    });
});

describe("GET /api/messages", () => {
    test("returns messages for a chat owned by the user", async () => {
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

        expect(mockGetChat).toHaveBeenCalledWith(
            "test-user-id",
            7
        );

        expect(mockGetMessages).toHaveBeenCalledWith("test-user-id", 7);

        expect(data).toEqual({
            messages: fakeMessages,
        });
    });

    test("returns 401 when the user is not authenticated", async () => {
        mockGetCurrentUser.mockResolvedValueOnce(null);

        const request = new NextRequest(
            "http://localhost/api/messages?chatId=7"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);

        expect(data).toEqual({
            error: "Unauthorized",
        });

        expect(mockGetChat).not.toHaveBeenCalled();
        expect(mockGetMessages).not.toHaveBeenCalled();
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

        expect(mockGetChat).not.toHaveBeenCalled();
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

        expect(mockGetChat).not.toHaveBeenCalled();
        expect(mockGetMessages).not.toHaveBeenCalled();
    });

    test("returns 404 when the chat does not belong to the user", async () => {
        mockGetChat.mockResolvedValueOnce(null);

        const request = new NextRequest(
            "http://localhost/api/messages?chatId=7"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);

        expect(mockGetChat).toHaveBeenCalledWith(
            "test-user-id",
            7
        );

        expect(mockGetMessages).not.toHaveBeenCalled();

        expect(data).toEqual({
            error: "Chat not found.",
        });
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

        expect(mockGetChat).toHaveBeenCalledWith(
            "test-user-id",
            7
        );

        expect(data).toEqual({
            error: "Failed to retrieve messages",
        });
    });
});