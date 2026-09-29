import { beforeEach, describe, expect, it, vi } from "vitest";

const {mockExtractPdfText, mockChunkDocument, mockEmbedChunks, mockInsertChunks, mockFindDocument, mockCreateDocument, mockDeleteDocument,} = vi.hoisted(() => ({
    mockExtractPdfText: vi.fn(),
    mockChunkDocument: vi.fn(),
    mockEmbedChunks: vi.fn(),
    mockInsertChunks: vi.fn(),
    mockFindDocument: vi.fn(),
    mockCreateDocument: vi.fn(),
    mockDeleteDocument: vi.fn(),
}));

vi.mock("../lib/extract", () => ({
    extractPdfText: mockExtractPdfText,
}));

vi.mock("../lib/chunk", () => ({
    chunkDocument: mockChunkDocument,
}));

vi.mock("../lib/embed", () => ({
    embedChunks: mockEmbedChunks,
}));

vi.mock("../lib/db", () => ({
    insertChunks: mockInsertChunks,
    findDocument: mockFindDocument,
    createDocument: mockCreateDocument,
    deleteDocument: mockDeleteDocument,
}));

import { ingestPdf } from "../lib/ingest";

describe("ingestPdf", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("extracts, chunks, embeds, and stores a PDF", async () => {
        mockExtractPdfText.mockResolvedValue("These are my psychology study notes.");
        const chunks = [
            {
                text: "These are my psychology",
                sourceDoc: "psychology.pdf",
                chunkIndex: 0,
                metadata: { subject: "PSYC" },
            },
            {
                text: "psychology study notes.",
                sourceDoc: "psychology.pdf",
                chunkIndex: 1,
                metadata: { subject: "PSYC" },
            },
        ];

        mockChunkDocument.mockReturnValue(chunks);
        const embeddedChunks = [
            {
                ...chunks[0],
                embedding: [0.1, 0.2],
            },
            {
                ...chunks[1],
                embedding: [0.3, 0.4],
            },
        ];

        mockEmbedChunks.mockResolvedValue(embeddedChunks);
        mockInsertChunks.mockResolvedValue(undefined);
        mockFindDocument.mockResolvedValue(null);
        mockCreateDocument.mockResolvedValue({id: 12,});
        mockDeleteDocument.mockResolvedValue(undefined);

        const buffer = Buffer.from("fake pdf data");
        const sourceDoc = "psychology.pdf";
        const metadata = { subject: "PSYC" };

        const result = await ingestPdf("test-user-id", buffer, sourceDoc, metadata);
        expect(mockFindDocument).toHaveBeenCalledWith("test-user-id", "PSYC", expect.any(String));
        expect(mockCreateDocument).toHaveBeenCalledWith("test-user-id", "psychology.pdf", expect.any(String), "PSYC");
        expect(result).toBe(2);
        expect(mockExtractPdfText).toHaveBeenCalledWith(buffer);
        expect(mockChunkDocument).toHaveBeenCalledWith("These are my psychology study notes.", sourceDoc, metadata);
        expect(mockEmbedChunks).toHaveBeenCalledWith(chunks);
        expect(mockInsertChunks).toHaveBeenCalledWith(embeddedChunks, 12);
        expect(mockDeleteDocument).not.toHaveBeenCalled();
    });

    it("throws when storing embedded chunks fails", async () => {
        mockExtractPdfText.mockResolvedValue(
            "These are my psychology study notes."
        );

        const chunks = [
            {
                text: "These are my psychology study notes.",
                sourceDoc: "psychology.pdf",
                chunkIndex: 0,
                metadata: { subject: "PSYC" },
            },
        ];

        const embeddedChunks = [
            {
                ...chunks[0],
                embedding: [0.1, 0.2],
            },
        ];

        mockChunkDocument.mockReturnValue(chunks);
        mockEmbedChunks.mockResolvedValue(embeddedChunks);
        mockFindDocument.mockResolvedValue(null);
        mockCreateDocument.mockResolvedValue({id: 12,});
        mockInsertChunks.mockRejectedValue(new Error("Database unavailable"));
        mockDeleteDocument.mockResolvedValue(undefined);

        const buffer = Buffer.from("fake pdf data");
        await expect(ingestPdf("test-user-id", buffer, "psychology.pdf", { subject: "PSYC" })).rejects.toThrow("Database unavailable");
        expect(mockDeleteDocument).toHaveBeenCalledWith("test-user-id", 12);
    });

    it("throws when the document has already been uploaded", async () => {
        mockFindDocument.mockResolvedValueOnce({
            id: 5,
            file_name: "psychology.pdf",
        });

        const buffer = Buffer.from("fake pdf data");

        await expect(ingestPdf("test-user-id", buffer, "psychology.pdf", { subject: "PSYC" })).rejects.toThrow("Document 'psychology.pdf' has already been uploaded");

        expect(mockCreateDocument).not.toHaveBeenCalled();
        expect(mockExtractPdfText).not.toHaveBeenCalled();
        expect(mockEmbedChunks).not.toHaveBeenCalled();
        expect(mockInsertChunks).not.toHaveBeenCalled();
    });
});