import { describe, expect, test, vi } from "vitest";
import { insertChunks, searchChunks, findDocument, createDocument, deleteDocument, getSubjects, getDocumentsBySubject} from "../lib/db";
import { EmbeddedChunk } from "../types/embeddedChunk";

const { mockFrom, mockInsert, mockSelect, mockRpc, mockEq, mockMaybeSingle, mockSingle, mockDelete, mockOrder } = vi.hoisted(() => {
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
});
mockInsert.mockReturnValue({
    select: mockSelect,
});

mockSelect.mockImplementation((columns?: string) => {
    if (columns === "id, file_name") {
        return documentQuery;
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

    return Promise.resolve({
        data: [{ id: 1 }],
        error: null,
    });
});

const documentQuery = {
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
};

mockEq.mockReturnValue(documentQuery);
mockDelete.mockReturnValue({eq: mockEq,});

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

        expect(getSubjects()).rejects.toThrow(
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

        expect(
            getDocumentsBySubject("COMP")
        ).rejects.toThrow(
            "Failed to retrieve documents: Database unavailable"
        );
    });
});