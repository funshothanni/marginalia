import { beforeEach, describe, expect, it, vi } from "vitest";

const {mockIngestPdf, mockGetCurrentUser,
} = vi.hoisted(() => ({
    mockIngestPdf: vi.fn(),
    mockGetCurrentUser: vi.fn(),
}));

vi.mock("../lib/ingest", () => ({
    ingestPdf: mockIngestPdf,
}));

vi.mock("../lib/auth", () => ({
    getCurrentUser: mockGetCurrentUser,
}));

import { POST } from "../app/api/upload/route";
import {DuplicateDocumentError} from "../lib/errors";

describe("POST /api/upload", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockGetCurrentUser.mockResolvedValue({
            id: "test-user-id",
        });
    });

    it("uploads and ingests a valid PDF", async () => {
        mockIngestPdf.mockResolvedValue(14);
        const file = new File(
            ["fake pdf contents"],
            "psychology.pdf",
            { type: "application/pdf" }
        );

        const formData = new FormData();

        formData.append("file", file);
        formData.append("subject", "PSYC");

        const request = new Request(
            "http://localhost:3000/api/upload",
            {
                method: "POST",
                body: formData,
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            message: "PDF uploaded successfully.",
            count: 14,
        });
        expect(mockIngestPdf).toHaveBeenCalledWith("test-user-id", expect.any(Buffer), "psychology.pdf", { subject: "PSYC" });
    });

    it("returns 400 when no file is provided", async () => {
        const formData = new FormData();
        formData.append("subject", "PSYC");

        const request = new Request(
            "http://localhost:3000/api/upload",
            {
                method: "POST",
                body: formData,
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({error: "Please upload a file.",});
        expect(mockIngestPdf).not.toHaveBeenCalled();
    });

    it("returns 400 when the uploaded file is not a PDF", async () => {
        const file = new File(
            ["fake text contents"],
            "notes.txt",
            { type: "text/plain" }
        );

        const formData = new FormData();
        formData.append("file", file);
        formData.append("subject", "PSYC");

        const request = new Request(
            "http://localhost:3000/api/upload",
            {
                method: "POST",
                body: formData,
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({error: "Only PDF files are supported.",});
        expect(mockIngestPdf).not.toHaveBeenCalled();
    });

    it("returns 400 when no subject is provided", async () => {
        const file = new File(
            ["fake pdf contents"],
            "psychology.pdf",
            { type: "application/pdf" }
        );

        const formData = new FormData();
        formData.append("file", file);

        const request = new Request(
            "http://localhost:3000/api/upload",
            {
                method: "POST",
                body: formData,
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({error: "Please provide a subject.",});
        expect(mockIngestPdf).not.toHaveBeenCalled();
    });

    it("returns 500 when PDF ingestion fails", async () => {
        mockIngestPdf.mockRejectedValue(
            new Error("Ingestion failed")
        );

        const file = new File(
            ["fake pdf contents"],
            "psychology.pdf",
            { type: "application/pdf" }
        );

        const formData = new FormData();
        formData.append("file", file);
        formData.append("subject", "PSYC");

        const request = new Request(
            "http://localhost:3000/api/upload",
            {
                method: "POST",
                body: formData,
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({error: "Internal server error",});
        expect(mockIngestPdf).toHaveBeenCalled();
    });

    it("returns 400 when subject is blank", async () => {
        const file = new File(
            ["fake pdf contents"],
            "psychology.pdf",
            { type: "application/pdf" }
        );

        const formData = new FormData();
        formData.append("file", file);
        formData.append("subject", "   ");

        const request = new Request(
            "http://localhost:3000/api/upload",
            {
                method: "POST",
                body: formData,
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({error: "Please provide a subject.",});
        expect(mockIngestPdf).not.toHaveBeenCalled();
    });

    it("returns 409 when the PDF has already been uploaded", async () => {
        mockIngestPdf.mockRejectedValueOnce(
            new DuplicateDocumentError("psychology.pdf")
        );

        const formData = new FormData();
        const file = new File(["fake pdf"], "psychology.pdf", { type: "application/pdf" });

        formData.append("file", file);
        formData.append("subject", "PSYC");

        const request = new Request(
            "http://localhost/api/upload",
            {
                method: "POST",
                body: formData,
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(409);
        expect(body).toEqual({error: "Document 'psychology.pdf' has already been uploaded",});
    });

    it("returns 401 when the user is not authenticated", async () => {
        mockGetCurrentUser.mockResolvedValueOnce(null);

        const file = new File(
            ["fake pdf contents"],
            "psychology.pdf",
            { type: "application/pdf" }
        );

        const formData = new FormData();
        formData.append("file", file);
        formData.append("subject", "PSYC");

        const request = new Request(
            "http://localhost:3000/api/upload",
            {
                method: "POST",
                body: formData,
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(401);

        expect(body).toEqual({
            error: "Unauthorized",
        });

        expect(mockIngestPdf).not.toHaveBeenCalled();
    });
});