import { beforeEach, describe, expect, it, vi } from "vitest";
const { mockEmbedText, mockFindChunksByPhrase, mockGetOverviewChunks, mockGetDocumentsBySubject, mockSearchChunks, mockGenerateAnswer,  mockRewriteQuestion } = vi.hoisted(() => {
    return {
        mockEmbedText: vi.fn(),
        mockFindChunksByPhrase: vi.fn(),
        mockSearchChunks: vi.fn(),
        mockGetOverviewChunks: vi.fn(),
        mockGetDocumentsBySubject: vi.fn(),
        mockGenerateAnswer: vi.fn(),
        mockRewriteQuestion: vi.fn(),
    };
});

vi.mock("../lib/embed", () => ({
    embedText: mockEmbedText,
}));

vi.mock("../lib/db", () => ({
    searchChunks: mockSearchChunks,
    findChunksByPhrase: mockFindChunksByPhrase,
    getOverviewChunks: mockGetOverviewChunks,
    getDocumentsBySubject: mockGetDocumentsBySubject,
}));

vi.mock("../lib/generate", () => ({
    generateAnswer: mockGenerateAnswer,
}));

vi.mock("../lib/rewrite", () => ({
    rewriteQuestion: mockRewriteQuestion,
}));

import { askQuestion } from "../lib/rag";

describe("askQuestion", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockRewriteQuestion.mockImplementation(
            async (question: string) => ({ question, scope: "targeted" })
        );
    });

    it("returns an answer using retrieved context", async () => {
        mockEmbedText.mockResolvedValue([0.1, 0.2, 0.3]);
       mockSearchChunks.mockResolvedValue([
            {
                id: 1,
                text: "Vector similarity compares numerical representations of text.",
                source_doc: "test.txt",
                metadata: { course: "TEST" },
                similarity: 0.9,
            },

            {
                id: 2,
                text: "RAG uses similarity search to retrieve relevant information.",
                source_doc: "test.txt",
                metadata: { course: "TEST" },
                similarity: 0.8,
            },
        ]);

       mockGenerateAnswer.mockResolvedValue(
            "Vector similarity compares text embeddings to find related information."
        );

        const question = "What is vector similarity?";
        const subject = "COMP"
        const answer = await askQuestion("test-user-id", question, subject);

        expect(answer).toBe("Vector similarity compares text embeddings to find related information.");
        expect(mockEmbedText).toHaveBeenCalledWith(question);
        expect(mockSearchChunks).toHaveBeenCalledWith("test-user-id", [0.1, 0.2, 0.3], subject, 5);
        expect(mockGenerateAnswer).toHaveBeenCalledWith(question, "Vector similarity compares numerical representations of text.\n\n" + "RAG uses similarity search to retrieve relevant information.");
    });

    it.each([{ chunks: [] }, { chunks: [{ text: "Unrelated notes", similarity: 0.1 }] }])(
        "returns a grounded fallback without generating when no relevant excerpts qualify",
        async ({ chunks }) => {
            mockEmbedText.mockResolvedValue([0.1, 0.2]);
            mockSearchChunks.mockResolvedValue(chunks);

            await expect(askQuestion("test-user-id", "What is in the notes?", "COMP 3380"))
                .resolves.toMatch(/couldn't find enough information/);
            expect(mockGenerateAnswer).not.toHaveBeenCalled();
        }
    );

    it("uses course excerpts for an explicit overview without embedding the question", async () => {
        const question = "What are the main ideas across all my PDFs?";
        mockRewriteQuestion.mockResolvedValueOnce({ question, scope: "course_overview" });
        mockGetOverviewChunks.mockResolvedValueOnce([
            { text: " Intro to probability. " },
            { text: " " },
            { text: "Intro to linear algebra." },
        ]);
        mockGenerateAnswer.mockResolvedValueOnce("An overview of the excerpts.");

        await expect(askQuestion("test-user-id", question, "COMP"))
            .resolves.toBe("An overview of the excerpts.");
        expect(mockGetOverviewChunks).toHaveBeenCalledWith("test-user-id", "COMP", 12);
        expect(mockEmbedText).not.toHaveBeenCalled();
        expect(mockSearchChunks).not.toHaveBeenCalled();
        expect(mockGenerateAnswer).toHaveBeenCalledWith(
            `Summarize what the course excerpts establish, even if they contain only one useful detail.

Student's request: ${question}`,
            "Intro to probability.\n\nIntro to linear algebra."
        );
    });

    it("discloses limited coverage when the database reports a sample", async () => {
        const question = "Summarize my notes.";
        const chunks = Array.from({ length: 12 }, (_, index) => ({ text: `Excerpt ${index + 1}`, is_sampled: true }));
        mockRewriteQuestion.mockResolvedValueOnce({ question, scope: "course_overview" });
        mockGetOverviewChunks.mockResolvedValueOnce(chunks);
        mockGenerateAnswer.mockResolvedValueOnce("An overview of the excerpts.");

        await expect(askQuestion("test-user-id", question, "COMP")).resolves.toBe(
            "**Coverage** · 12 excerpts were selected from a larger set of course materials.\n\nAn overview of the excerpts."
        );
        expect(mockGenerateAnswer).toHaveBeenCalledWith(
            expect.any(String),
            chunks.map((chunk) => chunk.text).join("\n\n")
        );
    });

    it("returns the grounded fallback when an overview has no usable excerpts", async () => {
        const question = "Summarize my notes.";
        mockRewriteQuestion.mockResolvedValueOnce({ question, scope: "course_overview" });
        mockGetOverviewChunks.mockResolvedValueOnce([{ text: " " }]);

        await expect(askQuestion("test-user-id", question, "COMP"))
            .resolves.toMatch(/couldn't find enough information/);
        expect(mockGenerateAnswer).not.toHaveBeenCalled();
    });

    it("keeps the similarity threshold for summaries of a specific topic", async () => {
        const question = "Summarize the notes on probability.";
        mockEmbedText.mockResolvedValueOnce([0.1, 0.2]);
        mockSearchChunks.mockResolvedValueOnce([{ text: "Low-score excerpt", similarity: 0.34 }]);

        await expect(askQuestion("test-user-id", question, "COMP"))
            .resolves.toMatch(/couldn't find enough information/);
        expect(mockSearchChunks).toHaveBeenCalledWith("test-user-id", [0.1, 0.2], "COMP", 5);
        expect(mockGetOverviewChunks).not.toHaveBeenCalled();
        expect(mockGenerateAnswer).not.toHaveBeenCalled();
    });

    it.each([
        { score: 0.34, usesPhrase: true },
        { score: 0.35, usesPhrase: false },
    ])("uses the phrase lookup only when vector search has no usable excerpt", async ({ score, usesPhrase }) => {
        const question = "What is the oxbow method?";
        mockRewriteQuestion.mockResolvedValueOnce({ question, scope: "targeted", lookupPhrase: "oxbow" });
        mockEmbedText.mockResolvedValueOnce([0.1, 0.2]);
        mockSearchChunks.mockResolvedValueOnce([{ text: "Vector excerpt", similarity: score }]);
        mockFindChunksByPhrase.mockResolvedValueOnce([{ text: "Phrase excerpt" }]);
        mockGenerateAnswer.mockResolvedValueOnce("A grounded answer.");

        await expect(askQuestion("test-user-id", question, "COMP")).resolves.toBe("A grounded answer.");
        if (usesPhrase) {
            expect(mockFindChunksByPhrase).toHaveBeenCalledWith("test-user-id", "COMP", "oxbow", 5);
        } else {
            expect(mockFindChunksByPhrase).not.toHaveBeenCalled();
        }
        expect(mockGenerateAnswer).toHaveBeenCalledWith(question, usesPhrase ? "Phrase excerpt" : "Vector excerpt");
        mockFindChunksByPhrase.mockReset();
    });

    it("uses course-wide excerpts when the student asks what is in their notes", async () => {
        const question = "What is in my notes?";
        mockRewriteQuestion.mockResolvedValueOnce({ question, scope: "course_overview", documentReference: null });
        mockGetOverviewChunks.mockResolvedValueOnce([{ text: "Probability" }, { text: "Linear algebra" }]);
        mockGenerateAnswer.mockResolvedValueOnce("The notes cover probability and linear algebra.");

        await expect(askQuestion("test-user-id", question, "COMP"))
            .resolves.toBe("The notes cover probability and linear algebra.");
        expect(mockGetDocumentsBySubject).not.toHaveBeenCalled();
        expect(mockGetOverviewChunks).toHaveBeenCalledWith("test-user-id", "COMP", 12);
        expect(mockEmbedText).not.toHaveBeenCalled();
    });

    it.each(["lecture 25", "Lecture 25", "lecture 25.pdf"])("summarizes only the upload named %s", async (documentReference) => {
        const question = `okay what does ${documentReference} talk about?`;
        mockRewriteQuestion.mockResolvedValueOnce({ question, scope: "document_overview", documentReference });
        mockGetDocumentsBySubject.mockResolvedValueOnce([{ id: 25, file_name: "lecture 25.pdf" }]);
        mockGetOverviewChunks.mockResolvedValueOnce([{ text: "A B-tree organizes entries by key." }]);
        mockGenerateAnswer.mockResolvedValueOnce("The PDF describes B-trees.");

        await expect(askQuestion("test-user-id", question, "COMP")).resolves.toBe("The PDF describes B-trees.");
        expect(mockGetDocumentsBySubject).toHaveBeenCalledWith("test-user-id", "COMP");
        expect(mockGetOverviewChunks).toHaveBeenCalledWith("test-user-id", "COMP", 12, 25);
        expect(mockEmbedText).not.toHaveBeenCalled();
    });

    it("accepts a borderline vector match only after resolving a named PDF", async () => {
        const question = "How does lecture 25 explain indexing?";
        const excerpt = "A B-tree index keeps keys ordered.";
        mockRewriteQuestion.mockResolvedValueOnce({ question, scope: "targeted", documentReference: "lecture 25" });
        mockGetDocumentsBySubject.mockResolvedValueOnce([{ id: 25, file_name: "lecture 25.pdf" }]);
        mockEmbedText.mockResolvedValueOnce([0.1, 0.2]);
        mockSearchChunks.mockResolvedValueOnce([{ text: excerpt, similarity: 0.3393 }]);
        mockGenerateAnswer.mockResolvedValueOnce("The PDF describes a B-tree index.");

        await expect(askQuestion("test-user-id", question, "COMP")).resolves.toBe("The PDF describes a B-tree index.");
        expect(mockGenerateAnswer).toHaveBeenCalledWith(question, excerpt);
        expect(mockFindChunksByPhrase).not.toHaveBeenCalled();
    });

    it("filters both targeted retrieval paths by the resolved document", async () => {
        const question = "How does lecture 25 explain indexing?";
        mockRewriteQuestion.mockResolvedValueOnce({
            question, scope: "targeted", documentReference: "lecture 25", lookupPhrase: "indexing",
        });
        mockGetDocumentsBySubject.mockResolvedValueOnce([{ id: 25, file_name: "lecture 25.pdf" }]);
        mockEmbedText.mockResolvedValueOnce([0.1, 0.2]);
        mockSearchChunks.mockResolvedValueOnce([]);
        mockFindChunksByPhrase.mockResolvedValueOnce([{ text: "Indexing speeds up lookups." }]);
        mockGenerateAnswer.mockResolvedValueOnce("Indexing speeds up lookups.");

        await expect(askQuestion("test-user-id", question, "COMP")).resolves.toBe("Indexing speeds up lookups.");
        expect(mockSearchChunks).toHaveBeenCalledWith("test-user-id", [0.1, 0.2], "COMP", 5, 25);
        expect(mockFindChunksByPhrase).toHaveBeenCalledWith("test-user-id", "COMP", "indexing", 5, 25);
    });

    it.each([
        { ids: [], message: "I couldn't find a PDF with that name in this course." },
        { ids: [25, 26], message: "More than one upload matches that name. Which PDF did you mean?" },
    ])("keeps an unresolved document request out of retrieval", async ({ ids, message }) => {
        const question = "What does lecture 25 talk about?";
        mockRewriteQuestion.mockResolvedValueOnce({ question, scope: "document_overview", documentReference: "lecture 25" });
        mockGetDocumentsBySubject.mockResolvedValueOnce(ids.map((id) => ({ id, file_name: "lecture 25.pdf" })));

        await expect(askQuestion("test-user-id", question, "COMP")).resolves.toBe(message);
        expect(mockGetOverviewChunks).not.toHaveBeenCalled();
        expect(mockSearchChunks).not.toHaveBeenCalled();
    });

    it("uses the rewritten question without sending old answers to generation", async () => {
        const question = "Can you explain the second one more simply?";

        const history = [
            {
                id: 1,
                chat_id: 1,
                role: "assistant" as const,
                content: "1. Probability\n2. Linear Algebra\n3. Vector Calculus",
                created_at: "2026-09-25T00:00:00Z",
            },
        ];

        mockRewriteQuestion.mockResolvedValueOnce({
            question: "Can you explain Linear Algebra more simply?",
            scope: "targeted",
        });

        mockEmbedText.mockResolvedValue([0.1, 0.2]);

        mockSearchChunks.mockResolvedValue([
            {
                id: 1,
                text: "Linear algebra studies vectors and matrices.",
                source_doc: "notes.pdf",
                metadata: {},
                similarity: 0.9,
            },
        ]);

        mockGenerateAnswer.mockResolvedValue(
            "Linear algebra is..."
        );

        await askQuestion(
            "test-user-id",
            question,
            "COMP",
            history
        );

        expect(mockRewriteQuestion).toHaveBeenCalledWith(
            question,
            [
                {
                    role: "assistant",
                    content: "1. Probability\n2. Linear Algebra\n3. Vector Calculus",
                },
            ]
        );

        expect(mockEmbedText).toHaveBeenCalledWith(
            "Can you explain Linear Algebra more simply?"
        );

        expect(mockGenerateAnswer).toHaveBeenCalledWith(
            "Can you explain Linear Algebra more simply?",
            "Linear algebra studies vectors and matrices."
        );
    });
});
