import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET, POST, DELETE } from "../app/api/chats/route";
import { createChat, getChats, deleteChat } from "../lib/db";
import { NextRequest } from "next/server";

vi.mock("../lib/db", () => ({
    createChat: vi.fn(),
    getChats: vi.fn(),
    deleteChat: vi.fn(),
}));

const mockCreateChat = vi.mocked(createChat);
const mockGetChats = vi.mocked(getChats);
const mockDeleteChat = vi.mocked(deleteChat);

beforeEach(() => {
    vi.clearAllMocks();
});


describe("GET /api/chats", () => {
    test("returns all chats", async () => {
        const fakeChats = [
            {
                id: 2,
                title: "Binary Trees",
                subject: "COMP",
                created_at: "2026-09-22T12:00:00Z",
                updated_at: "2026-09-22T14:00:00Z",
            },
            {
                id: 1,
                title: "Bayes Theorem",
                subject: "STAT",
                created_at: "2026-09-22T10:00:00Z",
                updated_at: "2026-09-22T11:00:00Z",
            },
        ];

        mockGetChats.mockResolvedValueOnce(fakeChats);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
            chats: fakeChats,
        });
        expect(mockGetChats).toHaveBeenCalledOnce();
    });

    test("returns 500 when retrieving chats fails", async () => {
        mockGetChats.mockRejectedValueOnce(
            new Error("Database unavailable")
        );

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
            error: "Failed to retrieve chats",
        });
    });
});


describe("POST /api/chats", () => {
    test("creates a new chat", async () => {
        const fakeChat = {
            id: 3,
            title: "New Chat",
            subject: "COMP",
            created_at: "2026-09-22T15:00:00Z",
            updated_at: "2026-09-22T15:00:00Z",
        };

        mockCreateChat.mockResolvedValueOnce(fakeChat);

        const request = new NextRequest(
            "http://localhost/api/chats",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subject: "COMP",
                }),
            }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);

        expect(mockCreateChat).toHaveBeenCalledWith(
            "COMP"
        );

        expect(data).toEqual({
            chat: fakeChat,
        });
    });

    test("returns 400 when subject is missing", async () => {
        const request = new NextRequest(
            "http://localhost/api/chats",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
            error: "Subject is required",
        });

        expect(mockCreateChat).not.toHaveBeenCalled();
    });

    test("returns 500 when chat creation fails", async () => {
        mockCreateChat.mockRejectedValueOnce(
            new Error("Database unavailable")
        );

        const request = new NextRequest(
            "http://localhost/api/chats",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subject: "COMP",
                }),
            }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
            error: "Failed to create chat",
        });
    });
});

describe("DELETE /api/chats", () => {
    test("deletes a chat", async () => {
        mockDeleteChat.mockResolvedValueOnce();

        const request = new NextRequest(
            "http://localhost/api/chats?id=7",
            {
                method: "DELETE",
            }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(200);

        expect(mockDeleteChat).toHaveBeenCalledWith(7);

        expect(data).toEqual({
            message: "Chat deleted successfully",
        });
    });

    test("returns 400 when chat ID is missing", async () => {
        const request = new NextRequest(
            "http://localhost/api/chats",
            {
                method: "DELETE",
            }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(400);

        expect(data).toEqual({
            error: "Chat ID is required",
        });

        expect(mockDeleteChat).not.toHaveBeenCalled();
    });

    test("returns 400 when chat ID is invalid", async () => {
        const request = new NextRequest(
            "http://localhost/api/chats?id=abc",
            {
                method: "DELETE",
            }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(400);

        expect(data).toEqual({
            error: "Invalid chat ID",
        });

        expect(mockDeleteChat).not.toHaveBeenCalled();
    });

    test("returns 500 when chat deletion fails", async () => {
        mockDeleteChat.mockRejectedValueOnce(
            new Error("Database unavailable")
        );

        const request = new NextRequest(
            "http://localhost/api/chats?id=7",
            {
                method: "DELETE",
            }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(500);

        expect(data).toEqual({
            error: "Failed to delete chat",
        });
    });
});