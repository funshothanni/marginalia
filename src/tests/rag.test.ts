import { beforeEach, describe, expect, it, vi } from "vitest";
const { mockEmbedText, mockSearchChunks, mockGenerateAnswer,  mockRewriteQuestion } = vi.hoisted(() => {
    return {
        mockEmbedText: vi.fn(),
        mockSearchChunks: vi.fn(),
        mockGenerateAnswer: vi.fn(),
        mockRewriteQuestion: vi.fn(),
    };
});

vi.mock("../lib/embed", () => ({
    embedText: mockEmbedText,
}));

vi.mock("../lib/db", () => ({
    searchChunks: mockSearchChunks,
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
            async (question: string) => question
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

        mockRewriteQuestion.mockResolvedValue(
            "Can you explain Linear Algebra more simply?"
        );

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
