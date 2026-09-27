import {beforeEach, describe, expect, it, vi} from "vitest";

const {mockAskQuestion, mockCreateMessage, mockUpdateChatTimestamp, mockGetChat, mockUpdateChatTitle, mockGetMessages, mockGetCurrentUser,
} = vi.hoisted(() => ({
    mockAskQuestion: vi.fn(),
    mockCreateMessage: vi.fn(),
    mockUpdateChatTimestamp: vi.fn(),
    mockGetChat: vi.fn(),
    mockGetMessages: vi.fn(),
    mockUpdateChatTitle: vi.fn(),
    mockGetCurrentUser: vi.fn(),
}));

vi.mock("../lib/rag", () => ({
    askQuestion: mockAskQuestion,
}));

vi.mock("../lib/db", () => ({
    createMessage: mockCreateMessage,
    updateChatTimestamp: mockUpdateChatTimestamp,
    getChat: mockGetChat,
    updateChatTitle: mockUpdateChatTitle,
    getMessages: mockGetMessages,
}));

vi.mock("../lib/auth", () => ({
    getCurrentUser: mockGetCurrentUser,
}));

import {POST} from "../app/api/query/route";

describe("POST /api/query", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetCurrentUser.mockResolvedValue({id: "test-user-id", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "2026-09-27T00:00:00Z",});
        mockGetChat.mockResolvedValue({id: 7, title: "New Chat", subject: "PSYC", created_at: "2026-09-23T12:00:00Z", updated_at: "2026-09-23T12:00:00Z",});
        mockGetMessages.mockResolvedValue([]);
    });

    it("receives a valid question and subject", async () => {
        mockAskQuestion.mockResolvedValue("Operant conditioning is something in PSYC");

        const request = new Request(
            "http://localhost:3000/api/query",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: "What is operant conditioning?",
                    subject: "PSYC",
                    chatId: 7,
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({answer: "Operant conditioning is something in PSYC"});
        expect(mockAskQuestion).toHaveBeenCalledWith("What is operant conditioning?", "PSYC", []);
        expect(mockCreateMessage).toHaveBeenNthCalledWith(1, "test-user-id", 7, "user", "What is operant conditioning?");
        expect(mockCreateMessage).toHaveBeenNthCalledWith(2, "test-user-id", 7, "assistant", "Operant conditioning is something in PSYC");
        expect(mockCreateMessage).toHaveBeenCalledTimes(2);
        expect(mockUpdateChatTimestamp).toHaveBeenCalledWith("test-user-id", 7);
        expect(mockUpdateChatTimestamp).toHaveBeenCalledTimes(1);
        expect(mockGetChat).toHaveBeenCalledWith("test-user-id", 7);
        expect(mockUpdateChatTitle).toHaveBeenCalledWith("test-user-id", 7, "What is operant conditioning?");
        expect(mockGetMessages).toHaveBeenCalledWith("test-user-id", 7);
    });

    it("returns 400 when no subject is provided", async () => {
        const request = new Request(
            "http://localhost:3000/api/query",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: "What is operant conditioning?",
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({error: "Please provide a subject."});
        expect(mockAskQuestion).not.toHaveBeenCalled();
    });

    it("returns 400 when no question is provided", async () => {
        const request = new Request(
            "http://localhost:3000/api/query",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subject: "PSYC",
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({error: "Please provide a question."});
        expect(mockAskQuestion).not.toHaveBeenCalled();
    });

    it("returns 400 when question is blank", async () => {
        const request = new Request(
            "http://localhost:3000/api/query",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: "   ",
                    subject: "PSYC",
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({error: "Please provide a question."});
        expect(mockAskQuestion).not.toHaveBeenCalled();
    });

    it("returns 400 when no chat ID is provided", async () => {
        const request = new Request(
            "http://localhost:3000/api/query",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: "What is operant conditioning?",
                    subject: "PSYC",
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({
            error: "Valid chat ID is required."
        });

        expect(mockAskQuestion).not.toHaveBeenCalled();
        expect(mockCreateMessage).not.toHaveBeenCalled();
    });

    it("does not rename an existing chat", async () => {
        mockGetChat.mockResolvedValueOnce({
            id: 7,
            title: "Operant Conditioning",
            subject: "PSYC",
            created_at: "2026-09-23T12:00:00Z",
            updated_at: "2026-09-23T12:00:00Z",
        });

        mockAskQuestion.mockResolvedValue(
            "Here is another explanation."
        );

        const request = new Request(
            "http://localhost:3000/api/query",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: "Can you explain that again?",
                    subject: "PSYC",
                    chatId: 7,
                }),
            }
        );

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockGetChat).toHaveBeenCalledWith("test-user-id", 7);
        expect(mockUpdateChatTitle).not.toHaveBeenCalled();
    });

    it("returns 404 when chat does not exist", async () => {
        mockGetChat.mockResolvedValueOnce(null);

        const request = new Request(
            "http://localhost:3000/api/query",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: "What is operant conditioning?",
                    subject: "PSYC",
                    chatId: 999,
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({error: "Chat not found."});
        expect(mockCreateMessage).not.toHaveBeenCalled();
        expect(mockAskQuestion).not.toHaveBeenCalled();
        expect(mockGetChat).toHaveBeenCalledWith("test-user-id", 999);
    });

    it("returns 500 when question answering fails", async () => {
        mockAskQuestion.mockRejectedValue(
            new Error("RAG failed")
        );

        const request = new Request(
            "http://localhost:3000/api/query",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: "What is operant conditioning?",
                    subject: "PSYC",
                    chatId: 7,
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({error: "Something went wrong"});
        expect(mockAskQuestion).toHaveBeenCalledWith("What is operant conditioning?", "PSYC", []);
        expect(mockCreateMessage).toHaveBeenCalledWith("test-user-id", 7, "user", "What is operant conditioning?");
        expect(mockCreateMessage).toHaveBeenCalledTimes(1);
    });

    it("passes previous chat messages to askQuestion", async () => {
        const previousMessages = [
            {
                id: 1,
                chat_id: 7,
                role: "user" as const,
                content: "What is classical conditioning?",
                created_at: "2026-09-24T10:00:00Z",
            },
            {
                id: 2,
                chat_id: 7,
                role: "assistant" as const,
                content: "Classical conditioning is a form of learning.",
                created_at: "2026-09-24T10:00:05Z",
            },
        ];

        mockGetChat.mockResolvedValueOnce({
            id: 7,
            title: "Classical Conditioning",
            subject: "PSYC",
            created_at: "2026-09-24T10:00:00Z",
            updated_at: "2026-09-24T10:00:05Z",
        });

        mockGetMessages.mockResolvedValueOnce(previousMessages);
        mockAskQuestion.mockResolvedValueOnce(
            "For example, a dog may learn to associate a bell with food."
        );

        const request = new Request(
            "http://localhost/api/query",
            {
                method: "POST",
                body: JSON.stringify({
                    question: "Can you give me an example of that?",
                    subject: "PSYC",
                    chatId: 7,
                }),
            }
        );

        const response = await POST(request);
        expect(response.status).toBe(200);
        expect(mockGetMessages).toHaveBeenCalledWith("test-user-id", 7);
        expect(mockAskQuestion).toHaveBeenCalledWith("Can you give me an example of that?", "PSYC", previousMessages);
    });

    it("returns 401 when user is not authenticated", async () => {
        mockGetCurrentUser.mockResolvedValueOnce(null);

        const request = new Request(
            "http://localhost:3000/api/query",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: "What is operant conditioning?",
                    subject: "PSYC",
                    chatId: 7,
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body).toEqual({
            error: "Unauthorized",
        });

        expect(mockGetChat).not.toHaveBeenCalled();
        expect(mockGetMessages).not.toHaveBeenCalled();
        expect(mockCreateMessage).not.toHaveBeenCalled();
        expect(mockAskQuestion).not.toHaveBeenCalled();
    });
});



