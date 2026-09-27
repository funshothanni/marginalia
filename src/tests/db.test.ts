import { describe, expect, test, vi } from "vitest";
import {
    insertChunks, searchChunks, findDocument, createDocument, deleteDocument, getSubjects, getDocumentsBySubject,
    createChat, createMessage, getMessages, getChats, updateChatTimestamp, updateChatTitle, getChat, deleteChat
} from "../lib/db";
import { EmbeddedChunk } from "../types/embeddedChunk";

const { mockFrom, mockInsert, mockSelect, mockRpc, mockEq, mockMaybeSingle, mockSingle, mockDelete, mockOrder, mockUpdate } = vi.hoisted(() => {
    process.env.SUPABASE_URL = "https://fake-project.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "fake-secret-key";
    return {
        mockFrom: vi.fn(),
        mockInsert: vi.fn(),
        mockSelect: vi.fn(),
        mockRpc: vi.fn(),
        mockEq: vi.fn(),
        mockMaybeSingle: vi.fn(),
        mockSingle: vi.fn(),
        mockDelete: vi.fn(),
        mockOrder: vi.fn(),
        mockUpdate: vi.fn(),
    };
});

vi.mock("@supabase/supabase-js", () => {
    return {
        createClient: vi.fn(() => ({
            from: mockFrom,
            rpc: mockRpc,
        })),
    };
});

mockFrom.mockImplementation((table: string) => {
    if (table === "note_chunks") {
        return {
            insert: mockInsert,
        };
    }

    if (table === "documents") {
        return {
            select: mockSelect,
            insert: mockInsert,
            delete: mockDelete,
        };
    }

    if (table === "chats") {
        return {
            insert: mockInsert,
            select: mockSelect,
            update: mockUpdate,
            delete: mockDelete,
        };
    }

    if (table === "messages") {
        return {
            insert: mockInsert,
            select: mockSelect,
        };
    }
});
mockInsert.mockReturnValue({
    select: mockSelect,
});

mockSelect.mockImplementation((columns?: string) => {
    if (columns === "id, file_name") {
        return {
            eq: mockEq,
            maybeSingle: mockMaybeSingle,
        };
    }

    if (columns === "id") {
        return {
            single: mockSingle,
        };
    }

    if (columns === "subject") {
        return Promise.resolve({
            data: [
                { subject: "PSYC" },
                { subject: "COMP" },
                { subject: "PSYC" },
            ],
            error: null,
        });
    }

    if (columns === "id, file_name, created_at") {
        return {
            eq: mockEq,
        };
    }

    if (columns === "id, title, subject, created_at, updated_at") {
        return {
            single: mockSingle,
            order: mockOrder,
            eq: mockEq,
        };
    }

    if (columns === "id, chat_id, role, content, created_at") {
        return {
            single: mockSingle,
            eq: mockEq,
        };
    }

    return Promise.resolve({
        data: [{ id: 1 }],
        error: null,
    });
});

mockEq.mockReturnValue({
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
    order: mockOrder,
});

mockDelete.mockReturnValue({
    eq: mockEq,
});

mockUpdate.mockReturnValue({
    eq: mockEq,
});

describe("insertChunks", () => {
    test("returns an empty array and does not contact Supabase when given no chunks", async () => {
        const result = await insertChunks([], 12);

        expect(result).toEqual([]);
        expect(mockFrom).not.toHaveBeenCalled();
    });

    test("inserts chunks into Supabase with the correct database fields", async () => {
        const chunks: EmbeddedChunk[] = [
            {
                text: "first chunk",
                sourceDoc: "test.txt",
                chunkIndex: 0,
                metadata: {subject: "TEST"},
                embedding: [0.1, 0.2],
            },
        ];

        const result = await insertChunks(chunks, 12);
        expect(mockFrom).toHaveBeenCalledWith("note_chunks")
        expect(mockInsert).toHaveBeenCalledWith([
            {
                text: "first chunk",
                source_doc: "test.txt",
                chunk_index: 0,
                metadata: { subject: "TEST" },
                embedding: [0.1, 0.2],
                document_id: 12,
            }
        ])
        expect(mockSelect).toHaveBeenCalledWith()
        expect(result).toEqual([{ id: 1 }]);
    })

    test("throws an error when Supabase insertion fails", async () => {
        const chunks: EmbeddedChunk[] = [
            {
                text: "first chunk",
                sourceDoc: "test.txt",
                chunkIndex: 0,
                metadata: {subject: "TEST"},
                embedding: [0.1, 0.2],
            },
        ];

        mockSelect.mockResolvedValueOnce({
            data: null,
            error: { message: "Database unavailable" },
        });

        await expect(insertChunks(chunks, 12)).rejects.toThrow("Failed to insert chunks: Database unavailable");
    })

    test("returns matching chunks from Supabase", async () => {
        const fakeEmbedding = [0.1, 0.2, 0.3];
        const fakeSubject = "COMP";

        const fakeResults = [
            {
                id: 1,
                text: "Vector similarity finds related information.",
                source_doc: "test.txt",
                metadata: {subject: "TEST"},
                similarity: 0.8,
            },
        ];

        mockRpc.mockResolvedValue({
            data: fakeResults,
            error: null,
        });

        const result = await searchChunks(fakeEmbedding, fakeSubject, 5);
        expect(result).toEqual(fakeResults);
        expect(mockRpc).toHaveBeenCalledWith("match_note_chunks", {
            query_embedding: fakeEmbedding,
            match_subject: fakeSubject,
            match_count: 5,
        });

    })

    test("throws an error when chunk retrieval fails", async () => {
        mockRpc.mockResolvedValueOnce({
            data: null,
            error: { message: "RPC failed" },
        });

        await expect(searchChunks([0.1, 0.2, 0.3], "MATH", 5)).rejects.toThrow("Failed to retrieve chunks: RPC failed");
    });
});

describe("findDocument", () => {
    test("returns an existing document", async () => {
        const fakeDocument = {
            id: 12,
            file_name: "lecture.pdf",
        };

        mockMaybeSingle.mockResolvedValueOnce({
            data: fakeDocument,
            error: null,
        });

        const result = await findDocument("PSYC", "abc123");

        expect(mockFrom).toHaveBeenCalledWith("documents");
        expect(mockSelect).toHaveBeenCalledWith("id, file_name");
        expect(mockEq).toHaveBeenCalledWith("subject", "PSYC");
        expect(mockEq).toHaveBeenCalledWith("file_hash", "abc123");
        expect(result).toEqual(fakeDocument);
    });

    test("returns null when the document does not exist", async () => {
        mockMaybeSingle.mockResolvedValueOnce({
            data: null,
            error: null,
        });

        const result = await findDocument("PSYC", "not-found");
        expect(result).toBeNull();
    });

    test("throws an error when checking the document fails", async () => {
        mockMaybeSingle.mockResolvedValueOnce({
            data: null,
            error: { message: "Database unavailable" },
        });

        await expect(findDocument("PSYC", "abc123")).rejects.toThrow("Failed to check document: Database unavailable");
    });
});


describe("createDocument", () => {
    test("creates a document and returns its id", async () => {
        mockSingle.mockResolvedValueOnce({
            data: { id: 12 },
            error: null,
        });

        const result = await createDocument("lecture.pdf", "abc123", "PSYC");

        expect(mockFrom).toHaveBeenCalledWith("documents");
        expect(mockInsert).toHaveBeenCalledWith({file_name: "lecture.pdf", file_hash: "abc123", subject: "PSYC",});
        expect(mockSelect).toHaveBeenCalledWith("id");
        expect(result).toEqual({ id: 12 });
    });

    test("throws an error when document creation fails", async () => {
        mockSingle.mockResolvedValueOnce({
            data: null,
            error: { message: "Insert failed" },
        });

        await expect(createDocument("lecture.pdf", "abc123", "PSYC")).rejects.toThrow("Failed to create document: Insert failed");
    });
});

describe("deleteDocument", () => {
    test("deletes the document by id", async () => {
        mockEq.mockResolvedValueOnce({
            error: null,
        });

        await deleteDocument(12);

        expect(mockFrom).toHaveBeenCalledWith("documents");
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq).toHaveBeenCalledWith("id", 12);
    });

    test("throws an error when document deletion fails", async () => {
        mockEq.mockResolvedValueOnce({
            error: { message: "Delete failed" },
        });

        await expect(deleteDocument(12)).rejects.toThrow(
            "Failed to delete document: Delete failed"
        );
    });
});

describe("getSubjects", () => {
    test("returns unique subjects from uploaded documents", async () => {
        const result = await getSubjects();

        expect(mockFrom).toHaveBeenCalledWith("documents");
        expect(mockSelect).toHaveBeenCalledWith("subject");
        expect(result).toEqual(["PSYC", "COMP"]);
    });

    test("throws an error when retrieving subjects fails", async () => {
        mockSelect.mockResolvedValueOnce({
            data: null,
            error: { message: "Database unavailable" },
        });

        await expect(getSubjects()).rejects.toThrow(
            "Failed to retrieve subjects: Database unavailable"
        );
    });
});

describe("getDocumentsBySubject", () => {
    test("returns documents belonging to the selected subject", async () => {
        const fakeDocuments = [
            {
                id: 2,
                file_name: "lecture2.pdf",
                created_at: "2026-09-15T12:00:00Z",
            },
            {
                id: 1,
                file_name: "lecture1.pdf",
                created_at: "2026-09-14T12:00:00Z",
            },
        ];

        mockEq.mockReturnValueOnce({
            order: mockOrder,
        });

        mockOrder.mockResolvedValueOnce({
            data: fakeDocuments,
            error: null,
        });

        const result = await getDocumentsBySubject("COMP");

        expect(mockFrom).toHaveBeenCalledWith("documents");

        expect(mockSelect).toHaveBeenCalledWith(
            "id, file_name, created_at"
        );

        expect(mockEq).toHaveBeenCalledWith(
            "subject",
            "COMP"
        );

        expect(mockOrder).toHaveBeenCalledWith(
            "created_at",
            { ascending: false }
        );

        expect(result).toEqual(fakeDocuments);
    });

    test("throws when retrieving documents fails", async () => {
        mockEq.mockReturnValueOnce({
            order: mockOrder,
        });

        mockOrder.mockResolvedValueOnce({
            data: null,
            error: { message: "Database unavailable" },
        });

        await expect(getDocumentsBySubject("COMP")).rejects.toThrow("Failed to retrieve documents: Database unavailable");
    });
});

describe("createChat", () => {
    test("creates a chat and returns it", async () => {
        const fakeChat = {
            id: 1,
            title: "New Chat",
            subject: "COMP",
            created_at: "2026-09-22T12:00:00Z",
            updated_at: "2026-09-22T12:00:00Z",
        };

        mockSingle.mockResolvedValueOnce({
            data: fakeChat,
            error: null,
        });

        const result = await createChat("COMP");

        expect(mockFrom).toHaveBeenCalledWith("chats");

        expect(mockInsert).toHaveBeenCalledWith({
            subject: "COMP",
            title: "New Chat",
        });

        expect(mockSelect).toHaveBeenCalledWith(
            "id, title, subject, created_at, updated_at"
        );

        expect(result).toEqual(fakeChat);
    });

    test("creates a chat with a custom title", async () => {
        const fakeChat = {
            id: 2,
            title: "Binary Trees",
            subject: "COMP",
            created_at: "2026-09-22T12:00:00Z",
            updated_at: "2026-09-22T12:00:00Z",
        };

        mockSingle.mockResolvedValueOnce({
            data: fakeChat,
            error: null,
        });

        const result = await createChat(
            "COMP",
            "Binary Trees"
        );

        expect(mockInsert).toHaveBeenCalledWith({
            subject: "COMP",
            title: "Binary Trees",
        });

        expect(result).toEqual(fakeChat);
    });

    test("throws an error when chat creation fails", async () => {
        mockSingle.mockResolvedValueOnce({
            data: null,
            error: {
                message: "Database unavailable"
            },
        });

        await expect(createChat("COMP")).rejects.toThrow("Failed to create chat: Database unavailable");
    });
});

describe("createMessage", () => {
    test("creates a user message and returns it", async () => {
        const fakeMessage = {
            id: 1,
            chat_id: 7,
            role: "user",
            content: "What is a binary tree?",
            created_at: "2026-09-22T12:00:00Z",
        };

        mockSingle.mockResolvedValueOnce({
            data: fakeMessage,
            error: null,
        });

        const result = await createMessage(
            7,
            "user",
            "What is a binary tree?"
        );

        expect(mockFrom).toHaveBeenCalledWith("messages");

        expect(mockInsert).toHaveBeenCalledWith({
            chat_id: 7,
            role: "user",
            content: "What is a binary tree?",
        });

        expect(mockSelect).toHaveBeenCalledWith(
            "id, chat_id, role, content, created_at"
        );

        expect(result).toEqual(fakeMessage);
    });

    test("creates an assistant message", async () => {
        const fakeMessage = {
            id: 2,
            chat_id: 7,
            role: "assistant",
            content: "A binary tree is...",
            created_at: "2026-09-22T12:00:01Z",
        };

        mockSingle.mockResolvedValueOnce({
            data: fakeMessage,
            error: null,
        });

        const result = await createMessage(
            7,
            "assistant",
            "A binary tree is..."
        );

        expect(mockInsert).toHaveBeenCalledWith({
            chat_id: 7,
            role: "assistant",
            content: "A binary tree is...",
        });

        expect(result).toEqual(fakeMessage);
    });

    test("throws an error when message creation fails", async () => {
        mockSingle.mockResolvedValueOnce({
            data: null,
            error: {
                message: "Database unavailable"
            },
        });

        await expect(createMessage(7, "user", "What is a binary tree?"))
            .rejects.toThrow("Failed to create message: Database unavailable"
        );
    });
});

describe("getMessages", () => {
    test("returns messages for a chat in chronological order", async () => {
        const fakeMessages = [
            {
                id: 1,
                chat_id: 7,
                role: "user",
                content: "What is a binary tree?",
                created_at: "2026-09-22T12:00:00Z",
            },
            {
                id: 2,
                chat_id: 7,
                role: "assistant",
                content: "A binary tree is...",
                created_at: "2026-09-22T12:00:01Z",
            },
        ];

        mockEq.mockReturnValueOnce({
            order: mockOrder,
        });

        mockOrder.mockResolvedValueOnce({
            data: fakeMessages,
            error: null,
        });

        const result = await getMessages(7);

        expect(mockFrom).toHaveBeenCalledWith("messages");

        expect(mockSelect).toHaveBeenCalledWith(
            "id, chat_id, role, content, created_at"
        );

        expect(mockEq).toHaveBeenCalledWith(
            "chat_id",
            7
        );

        expect(mockOrder).toHaveBeenCalledWith(
            "created_at",
            { ascending: true }
        );

        expect(result).toEqual(fakeMessages);
    });

    test("returns an empty array when the chat has no messages", async () => {
        mockEq.mockReturnValueOnce({
            order: mockOrder,
        });

        mockOrder.mockResolvedValueOnce({
            data: [],
            error: null,
        });

        const result = await getMessages(7);

        expect(result).toEqual([]);
    });

    test("throws an error when retrieving messages fails", async () => {
        mockEq.mockReturnValueOnce({
            order: mockOrder,
        });

        mockOrder.mockResolvedValueOnce({
            data: null,
            error: {
                message: "Database unavailable"
            },
        });

        await expect( getMessages(7)).rejects.toThrow(
            "Failed to retrieve messages: Database unavailable"
        );
    });
});

describe("getChats", () => {
    test("returns chats ordered by most recently updated", async () => {
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

        mockOrder.mockResolvedValueOnce({
            data: fakeChats,
            error: null,
        });

        const result = await getChats("test-user-id");

        expect(mockFrom).toHaveBeenCalledWith("chats");

        expect(mockSelect).toHaveBeenCalledWith(
            "id, title, subject, created_at, updated_at"
        );

        expect(mockEq).toHaveBeenCalledWith(
            "user_id",
            "test-user-id"
        );

        expect(mockOrder).toHaveBeenCalledWith(
            "updated_at",
            { ascending: false }
        );

        expect(result).toEqual(fakeChats);
    });

    test("returns an empty array when there are no chats", async () => {
        mockOrder.mockResolvedValueOnce({
            data: [],
            error: null,
        });

        const result = await getChats("test-user-id")

        expect(result).toEqual([]);
    });

    test("throws an error when retrieving chats fails", async () => {
        mockOrder.mockResolvedValueOnce({
            data: null,
            error: {
                message: "Database unavailable",
            },
        });

        await expect(
            getChats("test-user-id")
        ).rejects.toThrow(
            "Failed to retrieve chats: Database unavailable"
        );
    });
});

describe("updateChatTimestamp", () => {
    test("updates the chat timestamp", async () => {
        mockEq.mockResolvedValueOnce({
            error: null,
        });

        await updateChatTimestamp(7);

        expect(mockFrom).toHaveBeenCalledWith("chats");

        expect(mockUpdate).toHaveBeenCalledWith({
            updated_at: expect.any(String),
        });

        expect(mockEq).toHaveBeenCalledWith(
            "id",
            7
        );
    });

    test("throws an error when updating the timestamp fails", async () => {
        mockEq.mockResolvedValueOnce({
            error: {
                message: "Database unavailable",
            },
        });

        await expect(updateChatTimestamp(7)).rejects.toThrow(
            "Failed to update chat timestamp: Database unavailable"
        );
    });
});

describe("updateChatTitle", () => {
    test("updates the chat title", async () => {
        mockEq.mockResolvedValueOnce({
            error: null,
        });

        await updateChatTitle(
            7,
            "What is operant conditioning?"
        );

        expect(mockFrom).toHaveBeenCalledWith("chats");

        expect(mockUpdate).toHaveBeenCalledWith({
            title: "What is operant conditioning?",
        });

        expect(mockEq).toHaveBeenCalledWith("id", 7);
    });

    test("throws an error when updating the title fails", async () => {
        mockEq.mockResolvedValueOnce({
            error: {
                message: "Database unavailable",
            },
        });
        await expect(updateChatTitle( 7, "What is operant conditioning?")).rejects.toThrow("Failed to update chat title: Database unavailable");
    });
});

describe("getChat", () => {
    test("returns a chat by ID", async () => {
        const fakeChat = {
            id: 7,
            title: "New Chat",
            subject: "PSYC",
            created_at: "2026-09-23T12:00:00Z",
            updated_at: "2026-09-23T12:00:00Z",
        };

        mockEq.mockReturnValueOnce({
            maybeSingle: mockMaybeSingle,
        });

        mockMaybeSingle.mockResolvedValueOnce({
            data: fakeChat,
            error: null,
        });

        const result = await getChat(7);

        expect(mockFrom).toHaveBeenCalledWith("chats");

        expect(mockSelect).toHaveBeenCalledWith(
            "id, title, subject, created_at, updated_at"
        );

        expect(mockEq).toHaveBeenCalledWith("id", 7);

        expect(result).toEqual(fakeChat);
    });

    test("returns null when the chat does not exist", async () => {
        mockEq.mockReturnValueOnce({
            maybeSingle: mockMaybeSingle,
        });

        mockMaybeSingle.mockResolvedValueOnce({
            data: null,
            error: null,
        });

        const result = await getChat(999);
        expect(result).toBeNull();
    });

    test("throws an error when retrieving the chat fails", async () => {
        mockEq.mockReturnValueOnce({
            maybeSingle: mockMaybeSingle,
        });

        mockMaybeSingle.mockResolvedValueOnce({
            data: null,
            error: {
                message: "Database unavailable",
            },
        });

        await expect(getChat(7)).rejects.toThrow("Failed to retrieve chat: Database unavailable"
        );
    });
});

describe("deleteChat", () => {
    test("deletes a chat by ID", async () => {
        mockEq.mockResolvedValueOnce({
            error: null,
        });

        await deleteChat(7);
        expect(mockFrom).toHaveBeenCalledWith("chats");
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq).toHaveBeenCalledWith( "id", 7);
    });

    test("throws an error when deleting a chat fails", async () => {
        mockEq.mockResolvedValueOnce({
            error: {
                message: "Database unavailable",
            },
        });

        await expect( deleteChat(7)).rejects.toThrow(
            "Failed to delete chat: Database unavailable"
        );
    });
});