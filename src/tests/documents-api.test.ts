import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

const {
    mockGetDocumentsBySubject,
    mockDeleteDocument
} = vi.hoisted(() => ({
    mockGetDocumentsBySubject: vi.fn(),
    mockDeleteDocument: vi.fn(),
}));

vi.mock("../lib/db", () => ({
    getDocumentsBySubject: mockGetDocumentsBySubject,
    deleteDocument: mockDeleteDocument,
}));

import {
    GET,
    DELETE
} from "../app/api/documents/route";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("GET /api/documents", () => {
    test("returns documents for the selected subject", async () => {
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

        mockGetDocumentsBySubject.mockResolvedValueOnce(
            fakeDocuments
        );

        const request = new NextRequest(
            "http://localhost/api/documents?subject=COMP"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);

        expect(
            mockGetDocumentsBySubject
        ).toHaveBeenCalledWith("COMP");

        expect(data).toEqual({
            documents: fakeDocuments
        });
    });

    test("returns 400 when subject is missing", async () => {
        const request = new NextRequest(
            "http://localhost/api/documents"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);

        expect(data).toEqual({
            error: "Subject is required"
        });

        expect(
            mockGetDocumentsBySubject
        ).not.toHaveBeenCalled();
    });

    test("returns 500 when retrieving documents fails", async () => {
        mockGetDocumentsBySubject.mockRejectedValueOnce(
            new Error("Database unavailable")
        );

        const request = new NextRequest(
            "http://localhost/api/documents?subject=COMP"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);

        expect(data).toEqual({
            error: "Failed to retrieve documents"
        });
    });
});

describe("DELETE /api/documents", () => {
    test("deletes a document and returns 200", async () => {
        mockDeleteDocument.mockResolvedValueOnce(undefined);

        const request = new NextRequest(
            "http://localhost/api/documents?id=12",
            { method: "DELETE" }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(mockDeleteDocument).toHaveBeenCalledWith(12);
        expect(data).toEqual({
            message: "Document deleted successfully"
        });
    });

    test("returns 400 when document ID is missing", async () => {
        const request = new NextRequest(
            "http://localhost/api/documents",
            { method: "DELETE" }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
            error: "Document ID is required"
        });

        expect(mockDeleteDocument).not.toHaveBeenCalled();
    });

    test("returns 400 when document ID is invalid", async () => {
        const request = new NextRequest(
            "http://localhost/api/documents?id=abc",
            { method: "DELETE" }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
            error: "Invalid document ID"
        });

        expect(mockDeleteDocument).not.toHaveBeenCalled();
    });

    test("returns 500 when document deletion fails", async () => {
        mockDeleteDocument.mockRejectedValueOnce(
            new Error("Database unavailable")
        );

        const request = new NextRequest(
            "http://localhost/api/documents?id=12",
            { method: "DELETE" }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
            error: "Failed to delete document"
        });
    });
});